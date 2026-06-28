"""Tests for compatibility features. Anchored to the literature claims
made in features.py — bumping a constant should require a test update."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from lumin_ml.features import (
    UserFeatures,
    attachment_fit,
    compute_features,
    goal_alignment,
    kids_alignment,
    neuroticism_risk,
    values_congruence,
)


def make_user(**overrides) -> UserFeatures:
    defaults = dict(
        user_id="u1",
        age=30,
        gender="WOMAN",
        city="Singapore",
        residency_region="SG",
        relationship_goal="SERIOUS_DATING",
        attachment="SECURE",
        big_five=np.array([0.5, 0.6, 0.5, 0.6, 0.4]),
        values_vec=np.array([0.5] * 10),
        profile_embedding=np.ones(3072) / np.sqrt(3072),
        wants_kids="OPEN",
    )
    defaults.update(overrides)
    return UserFeatures(**defaults)


class TestAttachmentFit:
    def test_secure_secure_is_highest(self) -> None:
        assert attachment_fit("SECURE", "SECURE") == 1.0

    def test_anxious_avoidant_is_trap(self) -> None:
        # The classic anxious-avoidant trap — must score lower than secure-secure
        assert attachment_fit("ANXIOUS", "AVOIDANT") < attachment_fit("SECURE", "SECURE")
        assert attachment_fit("ANXIOUS", "AVOIDANT") <= 0.3

    def test_unknown_is_neutral(self) -> None:
        assert attachment_fit("UNKNOWN", "SECURE") == 0.5

    def test_symmetric(self) -> None:
        assert attachment_fit("ANXIOUS", "AVOIDANT") == attachment_fit("AVOIDANT", "ANXIOUS")


class TestGoalAlignment:
    def test_same_goal_perfect(self) -> None:
        a, b = make_user(relationship_goal="MARRIAGE"), make_user(relationship_goal="MARRIAGE")
        assert goal_alignment(a, b) == 1.0

    def test_marriage_exploring_is_mismatch(self) -> None:
        a = make_user(relationship_goal="MARRIAGE")
        b = make_user(relationship_goal="EXPLORING")
        assert goal_alignment(a, b) <= 0.25

    def test_adjacent_goals_decent(self) -> None:
        a = make_user(relationship_goal="MARRIAGE")
        b = make_user(relationship_goal="LIFE_PARTNER")
        assert goal_alignment(a, b) >= 0.8


class TestKidsAlignment:
    def test_yes_no_near_hard_filter(self) -> None:
        a, b = make_user(wants_kids="YES"), make_user(wants_kids="NO")
        assert kids_alignment(a, b) <= 0.1

    def test_open_softens_mismatch(self) -> None:
        a, b = make_user(wants_kids="YES"), make_user(wants_kids="OPEN")
        assert 0.5 < kids_alignment(a, b) < 0.9


class TestValuesCongruence:
    def test_identical_is_one(self) -> None:
        a = make_user(values_vec=np.array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
        b = make_user(values_vec=np.array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
        assert values_congruence(a, b) >= 0.99


class TestNeuroticismRisk:
    def test_both_high_is_risky(self) -> None:
        a = make_user(big_five=np.array([0.5, 0.5, 0.5, 0.5, 0.9]))
        b = make_user(big_five=np.array([0.5, 0.5, 0.5, 0.5, 0.85]))
        assert neuroticism_risk(a, b) <= 0.4

    def test_both_low_is_safe(self) -> None:
        a = make_user(big_five=np.array([0.5, 0.5, 0.5, 0.5, 0.2]))
        b = make_user(big_five=np.array([0.5, 0.5, 0.5, 0.5, 0.3]))
        assert neuroticism_risk(a, b) >= 0.8


class TestComputeFeatures:
    def test_returns_all_axes(self) -> None:
        a, b = make_user(), make_user(user_id="u2")
        f = compute_features(a, b)
        assert 0.0 <= f.attachment <= 1.0
        assert 0.0 <= f.goal <= 1.0
        assert 0.0 <= f.kids <= 1.0
        assert 0.0 <= f.values <= 1.0
        assert 0.0 <= f.neuroticism_risk <= 1.0
        assert 0.0 <= f.profile_sim <= 1.0
        assert 0.0 <= f.age <= 1.0
