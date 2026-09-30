"""Tests for ticket processor and utilities."""

import io
import pandas as pd
import pytest
from src.utils import CSVValidationError, compute_dashboard_metrics, validate_and_load_csv


def test_validate_and_load_csv_valid():
    csv_data = io.StringIO(
        "ticket_id,ticket\n"
        "TICK-001,My order has not arrived yet.\n"
        "TICK-002,Charged twice for my subscription.\n"
    )
    df = validate_and_load_csv(csv_data)
    assert len(df) == 2
    assert "ticket_id" in df.columns
    assert "ticket" in df.columns
    assert df.iloc[0]["ticket_id"] == "TICK-001"


def test_validate_and_load_csv_missing_id():
    csv_data = io.StringIO(
        "ticket\n"
        "Can I exchange my sweater?\n"
    )
    df = validate_and_load_csv(csv_data)
    assert len(df) == 1
    assert "ticket_id" in df.columns
    assert df.iloc[0]["ticket_id"].startswith("TICK-")


def test_validate_and_load_csv_missing_ticket_col():
    csv_data = io.StringIO(
        "customer_id,email\n"
        "101,test@example.com\n"
    )
    with pytest.raises(CSVValidationError):
        validate_and_load_csv(csv_data)


def test_validate_and_load_csv_empty():
    csv_data = io.StringIO("")
    with pytest.raises(CSVValidationError):
        validate_and_load_csv(csv_data)


def test_compute_dashboard_metrics():
    df = pd.DataFrame([
        {
            "ticket_id": "T-1",
            "ticket": "Refund please",
            "category": "Refund Request",
            "category_probability_raw": 0.95,
            "priority": "High",
            "department": "Returns & Refunds",
        },
        {
            "ticket_id": "T-2",
            "ticket": "Need help with login",
            "category": "Account Issue",
            "category_probability_raw": 0.60,
            "priority": "Low",
            "department": "Account Support",
        },
    ])

    metrics = compute_dashboard_metrics(df, threshold=0.70)
    assert metrics["total_tickets"] == 2
    assert metrics["high_urgent_count"] == 1
    assert metrics["low_confidence_count"] == 1
    assert metrics["category_counts"]["Refund Request"] == 1
    assert len(metrics["low_confidence_records"]) == 1


def test_load_actual_sample_tickets_file():
    df = validate_and_load_csv("data/sample_tickets.csv")
    assert len(df) >= 100
    assert "ticket_id" in df.columns
    assert "ticket" in df.columns

