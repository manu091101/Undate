"""Two-tower reciprocal recommendation trainer.

References:
  - Huang et al. (Microsoft, 2013) DSSM.
  - Covington, Adams, Sargin (Google, 2016) YouTubeDNN.
  - Xia et al. (RecSys 2019) two-way selection for person-job fit.
  - Tomita et al. (WSDM 2024) reciprocal recommendation.
  - Wang et al. (Sci Rep 2024) Improved Dual Tower.

Key dating-specific twist: loss requires *mutual* positive. A→B click without
B→A click is *not* a positive — it's a hard negative for B and a soft
negative for A.

Lumin will not train this until we have ≥10k mutual matches. Until then,
candidate generation is cosine-similarity over OpenAI/Voyage embeddings.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset


@dataclass
class TwoTowerConfig:
    input_dim: int = 3072  # profile_embedding dim
    hidden_dim: int = 512
    out_dim: int = 128
    dropout: float = 0.1
    learning_rate: float = 1e-3
    batch_size: int = 256
    epochs: int = 20
    in_batch_negatives: int = 64


class Tower(nn.Module):
    """Tower architecture: shared between user_a and user_b sides
    (siamese), since both sides are people in dating context."""

    def __init__(self, cfg: TwoTowerConfig) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(cfg.input_dim, cfg.hidden_dim),
            nn.GELU(),
            nn.Dropout(cfg.dropout),
            nn.Linear(cfg.hidden_dim, cfg.hidden_dim),
            nn.GELU(),
            nn.Dropout(cfg.dropout),
            nn.Linear(cfg.hidden_dim, cfg.out_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        z = self.net(x)
        return F.normalize(z, dim=-1)


class ReciprocalTwoTower(nn.Module):
    """Shared tower (since both sides are users); reciprocity enforced via loss."""

    def __init__(self, cfg: TwoTowerConfig) -> None:
        super().__init__()
        self.tower = Tower(cfg)

    def forward(self, a: torch.Tensor, b: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        return self.tower(a), self.tower(b)


def reciprocal_loss(
    za: torch.Tensor, zb: torch.Tensor, temperature: float = 0.07
) -> torch.Tensor:
    """In-batch negative sampling with bidirectional softmax.

    All B-side examples in the batch act as negatives for the A-side and vice-versa.
    The labeled positives are at the diagonal (paired in the dataset).
    """
    logits = za @ zb.t() / temperature
    targets = torch.arange(za.size(0), device=za.device)
    a_to_b = F.cross_entropy(logits, targets)
    b_to_a = F.cross_entropy(logits.t(), targets)
    return (a_to_b + b_to_a) / 2


class MutualMatchesDataset(Dataset):
    """Loads mutual-match pairs (A, B) where both expressed interest."""

    def __init__(self, embeddings_path: Path, pairs_path: Path) -> None:
        import numpy as np
        import pandas as pd

        self.embeds = np.load(embeddings_path)
        self.pairs = pd.read_parquet(pairs_path)
        # pairs columns: anchor_idx, candidate_idx (ints into embeds)

    def __len__(self) -> int:
        return len(self.pairs)

    def __getitem__(self, idx: int):
        row = self.pairs.iloc[idx]
        a = torch.from_numpy(self.embeds[row.anchor_idx]).float()
        b = torch.from_numpy(self.embeds[row.candidate_idx]).float()
        return a, b


def main(embeddings: Path, pairs: Path, out: Path, cfg: TwoTowerConfig) -> None:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    ds = MutualMatchesDataset(embeddings, pairs)
    loader = DataLoader(ds, batch_size=cfg.batch_size, shuffle=True, drop_last=True)
    model = ReciprocalTwoTower(cfg).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=cfg.learning_rate, weight_decay=1e-4)

    for epoch in range(cfg.epochs):
        model.train()
        total = 0.0
        n = 0
        for a, b in loader:
            a, b = a.to(device), b.to(device)
            za, zb = model(a, b)
            loss = reciprocal_loss(za, zb)
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            total += loss.item() * a.size(0)
            n += a.size(0)
        print(f"epoch {epoch + 1:3d}/{cfg.epochs}  loss={total / max(n, 1):.4f}")

    out.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"model": model.state_dict(), "cfg": cfg.__dict__}, out)
    print(f"saved {out}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--embeddings", type=Path, required=True, help="numpy .npy of (N, D)")
    p.add_argument("--pairs", type=Path, required=True, help="parquet with anchor_idx, candidate_idx")
    p.add_argument("--out", type=Path, default=Path("./models/two_tower_v0.1.pt"))
    args = p.parse_args()
    main(args.embeddings, args.pairs, args.out, TwoTowerConfig())
