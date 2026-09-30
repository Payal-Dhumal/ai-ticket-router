"""Tests for recommendation engine."""

from src.jev_router import CORE_CATEGORIES, PRIORITIES
from src.recommendations import (
    CATEGORY_RECOMMENDATIONS,
    get_complete_recommendation,
    get_priority_hint,
    get_recommended_action,
)


def test_all_core_categories_have_recommendations():
    for category in CORE_CATEGORIES:
        action = get_recommended_action(category)
        assert action is not None
        assert len(action) > 10
        assert action != "Review ticket manually and route to general support."


def test_case_insensitive_recommendation():
    action = get_recommended_action("payment issue")
    assert "Verify payment" in action


def test_unknown_category_fallback():
    action = get_recommended_action("Space Travel Glitch")
    assert "Review ticket manually" in action


def test_priority_hints():
    for priority in PRIORITIES:
        hint = get_priority_hint(priority)
        assert len(hint) > 5


def test_complete_recommendation():
    rec = get_complete_recommendation("Delivery Issue", "High", is_low_confidence_flag=True)
    assert "shipment" in rec["primary_action"].lower()
    assert "below threshold" in rec["review_notice"].lower()
