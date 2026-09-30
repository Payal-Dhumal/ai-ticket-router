"""Tests for probability calculation, formatting, and visualization."""

import pytest
from src.probability import (
    format_percentage,
    get_confidence_status,
    get_sorted_probabilities,
    is_low_confidence,
    normalize_probability,
    render_ascii_bar,
    render_distribution_bars,
)


def test_normalize_probability():
    assert normalize_probability(0.85) == 0.85
    assert normalize_probability(85.0) == 0.85
    assert normalize_probability(1.0) == 1.0
    assert normalize_probability(0.0) == 0.0
    assert normalize_probability(None) == 0.0
    assert normalize_probability(150.0) == 1.0
    assert normalize_probability(-5.0) == 0.0


def test_format_percentage():
    assert format_percentage(0.94) == "94%"
    assert format_percentage(0.0) == "0%"
    assert format_percentage(1.0) == "100%"
    assert format_percentage(0.942, decimals=1) == "94.2%"
    assert format_percentage(94.0) == "94%"


def test_is_low_confidence():
    assert is_low_confidence(0.65, threshold=0.70) is True
    assert is_low_confidence(0.70, threshold=0.70) is False
    assert is_low_confidence(0.85, threshold=0.70) is False
    # Percent scale
    assert is_low_confidence(65.0, threshold=70.0) is True


def test_get_confidence_status():
    status, color, msg = get_confidence_status(0.60, threshold=0.70)
    assert status == "Low Confidence"
    assert "manual review" in msg.lower()

    status, color, msg = get_confidence_status(0.75, threshold=0.70)
    assert status == "Moderate Confidence"

    status, color, msg = get_confidence_status(0.95, threshold=0.70)
    assert status == "High Confidence"


def test_render_ascii_bar():
    bar_91 = render_ascii_bar(0.91, length=20)
    assert "91%" in bar_91
    assert "█" in bar_91
    assert "░" in bar_91

    bar_100 = render_ascii_bar(1.0, length=10)
    assert bar_100 == "██████████ 100%"

    bar_0 = render_ascii_bar(0.0, length=10)
    assert bar_0 == "░░░░░░░░░░ 0%"


def test_get_sorted_probabilities():
    probs = {"Other": 0.05, "Payment Issue": 0.80, "Order Issue": 0.15}
    sorted_probs = get_sorted_probabilities(probs)
    assert sorted_probs[0] == ("Payment Issue", 0.80)
    assert sorted_probs[1] == ("Order Issue", 0.15)
    assert sorted_probs[2] == ("Other", 0.05)


def test_render_distribution_bars():
    probs = {"Payment Issue": 0.90, "Order Issue": 0.10}
    bars = render_distribution_bars(probs, top_n=2, bar_length=10)
    assert len(bars) == 2
    assert bars[0][0] == "Payment Issue"
    assert "90%" in bars[0][1]
