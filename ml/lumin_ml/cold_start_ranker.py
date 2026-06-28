"""Cold-start compatibility ranker.

Until we have ≥5,000 labeled curator decisions, this rule-based scorer
runs production. Weights are derived from the literature (see features.py);
they will be replaced by a learned LightGBM model once we have signal.
"""
from __future__ import annotations

from dataclasses import dataclass

from .features import CompatibilityFeatures, UserFeatures, compute_features

# Weight sources:
# - attachment + neuroticism: Mikulincer & Shaver 2016; Malouff et al. 2010
# - hard goals + kids: Gere & Schimmack 2013
# - values: Roccas & Sagiv 2010
# - profile_sim: weak prior, tie-breaker only
# These will be re-fit from data after the curator-label flywheel kicks in.
WEIGHTS = {
    "attachment": 0.22,
    "goal": 0.18,
    "kids": 0.18,
    "values": 0.15,
    "neuroticism_risk": 0.10,
    "profile_sim": 0.07,
    "age": 0.10,
}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-6, "weights must sum to 1"


@dataclass(frozen=True)
class RankedCandidate:
    user_id: str
    score: float
    breakdown: CompatibilityFeatures


def score(a: UserFeatures, b: UserFeatures) -> RankedCandidate:
    feats = compute_features(a, b)
    s = (
        WEIGHTS["attachment"] * feats.attachment
        + WEIGHTS["goal"] * feats.goal
        + WEIGHTS["kids"] * feats.kids
        + WEIGHTS["values"] * feats.values
        + WEIGHTS["neuroticism_risk"] * feats.neuroticism_risk
        + WEIGHTS["profile_sim"] * feats.profile_sim
        + WEIGHTS["age"] * feats.age
    )
    return RankedCandidate(user_id=b.user_id, score=float(s), breakdown=feats)


def rank(a: UserFeatures, candidates: list[UserFeatures], top_k: int = 50) -> list[RankedCandidate]:
    scored = [score(a, c) for c in candidates]
    scored.sort(key=lambda x: x.score, reverse=True)
    return scored[:top_k]
