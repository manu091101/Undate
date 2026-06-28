"""Offline evaluation harness.

Metrics tracked:
  - NDCG@k for ranker output vs curator decisions
  - Recall@k, MRR for retrieval
  - Calibration (ECE) for narrative confidence
  - Demographic parity: candidate exposure ratio across groups
  - Reciprocity: P(B-side positive | A-side positive)
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import ndcg_score


def ndcg_at_k(df: pd.DataFrame, k: int = 5) -> float:
    """df cols: cohort_id, label (0/1 or graded), score"""
    cohorts = df.groupby("cohort_id")
    scores = []
    for _, group in cohorts:
        if len(group) < 2:
            continue
        y_true = group["label"].to_numpy().reshape(1, -1)
        y_pred = group["score"].to_numpy().reshape(1, -1)
        scores.append(ndcg_score(y_true, y_pred, k=k))
    return float(np.mean(scores)) if scores else float("nan")


def recall_at_k(df: pd.DataFrame, k: int = 10) -> float:
    cohorts = df.groupby("cohort_id")
    scores = []
    for _, group in cohorts:
        positives = group[group["label"] > 0]
        if positives.empty:
            continue
        topk = group.nlargest(k, "score")
        hits = topk["label"].gt(0).sum()
        scores.append(hits / len(positives))
    return float(np.mean(scores)) if scores else float("nan")


def exposure_parity(df: pd.DataFrame, group_col: str) -> dict[str, float]:
    """Demographic exposure ratio. df cols: <group_col>, rank.
    Returns mean rank per group; values close to each other = parity."""
    return df.groupby(group_col)["rank"].mean().to_dict()


def reciprocity_rate(df: pd.DataFrame) -> float:
    """df cols: anchor_action (1=interested), candidate_action (1=interested)"""
    a_pos = df[df["anchor_action"] == 1]
    if a_pos.empty:
        return float("nan")
    return float(a_pos["candidate_action"].mean())
