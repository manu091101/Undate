"""Train the LightGBM ranker from curator labels.

Input: curator_labels.parquet — one row per (anchor_user, candidate_user, decision).
Decision is the curator's pairwise choice when shown N candidates.

Output: models/ranker_<version>.txt — LightGBM Booster.

Runs offline; production inference reads the booster from S3 at startup.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit


def main(input_path: Path, output_dir: Path, version: str) -> None:
    df = pd.read_parquet(input_path)
    expected = {
        "anchor_user_id", "candidate_user_id", "label",
        "feat_attachment", "feat_goal", "feat_kids",
        "feat_values", "feat_neuroticism_risk", "feat_profile_sim", "feat_age",
        "cohort_id",
    }
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    feature_cols = [c for c in df.columns if c.startswith("feat_")]
    X = df[feature_cols].to_numpy(dtype=np.float32)
    y = df["label"].to_numpy(dtype=np.int32)
    groups = df["cohort_id"].to_numpy()

    # Group split so we never leak a cohort across train/val.
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, val_idx = next(splitter.split(X, y, groups))

    train_group_sizes = (
        df.iloc[train_idx].groupby("cohort_id", sort=False).size().to_numpy()
    )
    val_group_sizes = (
        df.iloc[val_idx].groupby("cohort_id", sort=False).size().to_numpy()
    )

    train_ds = lgb.Dataset(X[train_idx], label=y[train_idx], group=train_group_sizes)
    val_ds = lgb.Dataset(X[val_idx], label=y[val_idx], group=val_group_sizes, reference=train_ds)

    params = {
        "objective": "lambdarank",
        "metric": "ndcg",
        "ndcg_eval_at": [3, 5, 10],
        "learning_rate": 0.05,
        "num_leaves": 31,
        "min_data_in_leaf": 20,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
    }
    booster = lgb.train(
        params,
        train_ds,
        num_boost_round=500,
        valid_sets=[val_ds],
        callbacks=[lgb.early_stopping(stopping_rounds=30), lgb.log_evaluation(period=25)],
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / f"ranker_{version}.txt"
    booster.save_model(str(model_path))

    importance = dict(zip(feature_cols, booster.feature_importance(importance_type="gain")))
    (output_dir / f"ranker_{version}_meta.json").write_text(
        json.dumps(
            {
                "version": version,
                "n_train": int(len(train_idx)),
                "n_val": int(len(val_idx)),
                "feature_importance_gain": {k: float(v) for k, v in importance.items()},
                "best_iteration": int(booster.best_iteration),
            },
            indent=2,
        )
    )
    print(f"Saved {model_path}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output-dir", type=Path, default=Path("./models"))
    p.add_argument("--version", default="v0.1")
    args = p.parse_args()
    main(args.input, args.output_dir, args.version)
