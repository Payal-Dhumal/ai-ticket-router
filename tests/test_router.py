"""Tests for JevRouter."""

import os
import pytest
from src.jev_router import (
    CORE_CATEGORIES,
    DEPARTMENTS,
    PRIORITIES,
    JevConfigurationError,
    JevEmptyInputError,
    JevRouter,
    is_jev_configured,
)


def test_is_jev_configured():
    assert is_jev_configured() is True


def test_empty_input_raises():
    router = JevRouter()
    with pytest.raises(JevEmptyInputError):
        router.classify("")
    with pytest.raises(JevEmptyInputError):
        router.classify("   \n\t  ")


def test_missing_api_key_raises(monkeypatch):
    monkeypatch.delenv("TYPESAFE_API_KEY", raising=False)
    monkeypatch.delenv("JEV_API_KEY", raising=False)
    router = JevRouter(api_key=None)
    with pytest.raises(JevConfigurationError):
        router.classify("Hello, I need help.")


@pytest.mark.skipif(not is_jev_configured(), reason="Jev API key not configured")
def test_live_jev_payment_issue_classification():
    router = JevRouter()
    result = router.classify("My credit card was charged twice for order #48921.")

    assert result.category in CORE_CATEGORIES
    assert result.priority in PRIORITIES
    assert result.department in DEPARTMENTS
    assert 0.0 <= result.category_probability <= 1.0
    assert 0.0 <= result.priority_probability <= 1.0
    assert 0.0 <= result.department_probability <= 1.0
    assert result.category == "Payment Issue"
    assert result.department == "Billing"
    assert "jev" in result.model.lower()


@pytest.mark.skipif(not is_jev_configured(), reason="Jev API key not configured")
def test_live_jev_delivery_issue_classification():
    router = JevRouter()
    result = router.classify("My package has not arrived and it was supposed to arrive yesterday.")

    assert result.category == "Delivery Issue"
    assert result.department == "Delivery"
    assert result.category_probability > 0.70
