"""Feature engineering for the compatibility model.

Lumin's working hypothesis (grounded in Joel & Eastwick 2020 PNAS):
similarity self-report explains <1% of relationship satisfaction variance.
Useful signal comes from:
  (1) attachment-style fit (only pre-meet variable with real effect size)
  (2) hard goal alignment (kids, marriage timing, geography)
  (3) values congruence on Schwartz conservation/transcendence axes
  (4) curator judgment (proxied by feedback-trained model)

Each feature here is documented with its source and weight rationale.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

AttachmentStyle = Literal["SECURE", "ANXIOUS", "AVOIDANT", "DISORGANIZED", "UNKNOWN"]
Goal = Literal["SERIOUS_DATING", "MARRIAGE", "LIFE_PARTNER", "EXPLORING"]


@dataclass(frozen=True)
class UserFeatures:
    user_id: str
    age: int
    gender: str
    city: str
    residency_region: str
    relationship_goal: Goal
    attachment: AttachmentStyle
    big_five: np.ndarray | None  # shape (5,)
    values_vec: np.ndarray | None  # shape (10,)
    profile_embedding: np.ndarray | None  # shape (3072,)
    wants_kids: Literal["YES", "NO", "OPEN", "HAVE_WANT_MORE", "HAVE_DONE", None]


# Bartholomew / Hazan-Shaver attachment compatibility matrix.
# Cell [i][j] = relative satisfaction rate of pair (i, j) vs base rate.
# Anchored to Mikulincer & Shaver, "Attachment in Adulthood" 2nd ed (2016).
_ATTACHMENT_MATRIX = {
    ("SECURE", "SECURE"): 1.0,
    ("SECURE", "ANXIOUS"): 0.75,
    ("SECURE", "AVOIDANT"): 0.65,
    ("SECURE", "DISORGANIZED"): 0.55,
    ("ANXIOUS", "ANXIOUS"): 0.35,
    ("ANXIOUS", "AVOIDANT"): 0.25,  # the trap pairing
    ("ANXIOUS", "DISORGANIZED"): 0.30,
    ("AVOIDANT", "AVOIDANT"): 0.40,
    ("AVOIDANT", "DISORGANIZED"): 0.30,
    ("DISORGANIZED", "DISORGANIZED"): 0.20,
}


def attachment_fit(a: AttachmentStyle, b: AttachmentStyle) -> float:
    """Return a 0–1 fit score. UNKNOWN treated as 0.5 (no signal)."""
    if a == "UNKNOWN" or b == "UNKNOWN":
        return 0.5
    pair = tuple(sorted([a, b]))
    return _ATTACHMENT_MATRIX.get(pair, 0.5)


def goal_alignment(a: UserFeatures, b: UserFeatures) -> float:
    """Hard filter, soft scoring.

    EXPLORING with EXPLORING: 1.0.
    MARRIAGE with EXPLORING: 0.2 (strong mismatch).
    Same goal: 1.0. Adjacent (e.g., SERIOUS_DATING ↔ LIFE_PARTNER): 0.85.
    """
    if a.relationship_goal == b.relationship_goal:
        return 1.0
    serious = {"MARRIAGE", "LIFE_PARTNER", "SERIOUS_DATING"}
    if a.relationship_goal in serious and b.relationship_goal in serious:
        return 0.85
    if {a.relationship_goal, b.relationship_goal} == {"MARRIAGE", "EXPLORING"}:
        return 0.2
    return 0.6


def kids_alignment(a: UserFeatures, b: UserFeatures) -> float:
    """Children plans are often the single biggest hidden dealbreaker."""
    if a.wants_kids is None or b.wants_kids is None:
        return 0.5
    if a.wants_kids == b.wants_kids:
        return 1.0
    if {a.wants_kids, b.wants_kids} == {"YES", "NO"}:
        return 0.05  # near-hard-filter
    if "OPEN" in {a.wants_kids, b.wants_kids}:
        return 0.7
    return 0.5


def values_congruence(a: UserFeatures, b: UserFeatures) -> float:
    """Cosine similarity over Schwartz values vector. Only conservation +
    self-transcendence dimensions are weighted (Roccas & Sagiv 2010)."""
    if a.values_vec is None or b.values_vec is None:
        return 0.5
    # Schwartz axes ordering convention:
    # [achievement, benevolence, conformity, hedonism, power,
    #  security, self-direction, stimulation, tradition, universalism]
    weights = np.array([0.6, 1.0, 0.8, 0.4, 0.4, 0.9, 0.6, 0.4, 0.9, 1.0])
    va, vb = a.values_vec * weights, b.values_vec * weights
    na, nb = np.linalg.norm(va), np.linalg.norm(vb)
    if na == 0 or nb == 0:
        return 0.5
    return float(np.clip((va @ vb) / (na * nb), 0.0, 1.0))


def neuroticism_risk(a: UserFeatures, b: UserFeatures) -> float:
    """Malouff et al. 2010 meta-analysis: neuroticism is the only Big Five
    trait with meaningful predictive power on dissolution (r ≈ −0.22).
    Two highly-neurotic partners is an elevated-risk pairing. Returns 0–1
    where 1 means low risk."""
    if a.big_five is None or b.big_five is None:
        return 0.7
    # Neuroticism is index 4 in standard Big Five ordering [O, C, E, A, N].
    na, nb = float(a.big_five[4]), float(b.big_five[4])
    if na > 0.75 and nb > 0.75:
        return 0.3
    if max(na, nb) > 0.8:
        return 0.55
    return 0.85


def profile_text_similarity(a: UserFeatures, b: UserFeatures) -> float:
    """Cosine similarity of profile embeddings — weak signal but useful
    for tie-breaking and conversation-thread suggestions."""
    if a.profile_embedding is None or b.profile_embedding is None:
        return 0.5
    va, vb = a.profile_embedding, b.profile_embedding
    return float(np.clip(va @ vb / (np.linalg.norm(va) * np.linalg.norm(vb)), 0.0, 1.0))


def age_compat(a: UserFeatures, b: UserFeatures) -> float:
    """Soft age compatibility. Lumin is 21+; large gaps penalized but not zeroed."""
    diff = abs(a.age - b.age)
    return float(np.exp(-(diff / 6) ** 2))


@dataclass(frozen=True)
class CompatibilityFeatures:
    attachment: float
    goal: float
    kids: float
    values: float
    neuroticism_risk: float
    profile_sim: float
    age: float


def compute_features(a: UserFeatures, b: UserFeatures) -> CompatibilityFeatures:
    return CompatibilityFeatures(
        attachment=attachment_fit(a.attachment, b.attachment),
        goal=goal_alignment(a, b),
        kids=kids_alignment(a, b),
        values=values_congruence(a, b),
        neuroticism_risk=neuroticism_risk(a, b),
        profile_sim=profile_text_similarity(a, b),
        age=age_compat(a, b),
    )
