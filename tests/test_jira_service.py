"""Tests for Jira Service integration."""

import os
from unittest.mock import MagicMock, patch
import pytest

from src.jira_service import (
    create_jira_issue,
    get_jira_config,
    is_jira_configured,
    map_priority_to_jira,
    test_jira_connection as check_jira_connection,
)


def test_is_jira_configured():
    # Should be True given the .env configuration
    assert is_jira_configured() is True


def test_get_jira_config_sanitized():
    cfg = get_jira_config()
    assert "url" in cfg
    assert "email" in cfg
    assert "project_key" in cfg
    assert cfg["project_key"] == "SUP"
    assert "api_token" not in cfg  # Token must never be exposed


def test_map_priority_to_jira():
    assert map_priority_to_jira("Urgent") == "Highest"
    assert map_priority_to_jira("High") == "High"
    assert map_priority_to_jira("Medium") == "Medium"
    assert map_priority_to_jira("Low") == "Low"
    assert map_priority_to_jira("Unknown") == "Medium"


def test_create_jira_issue_mocked_success():
    sample_ai_result = {
        "category": "Account Access",
        "priority": "High",
        "category_probability": "94%",
        "department": "Technical Support",
        "recommended_action": "Customer cannot access their account. Prompt user for verified identity.",
    }
    sample_text = "I am locked out of my account and not receiving the password reset email."

    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {
        "id": "10042",
        "key": "SUP-105",
        "self": "https://payaldhumal94.atlassian.net/rest/api/2/issue/10042",
    }

    with patch("requests.post", return_value=mock_resp) as mock_post:
        res = create_jira_issue(sample_ai_result, sample_text)
        assert res["success"] is True
        assert res["issue_key"] == "SUP-105"
        assert "payaldhumal94.atlassian.net/browse/SUP-105" in res["issue_url"]
        assert res["project_key"] == "SUP"
        assert mock_post.called

        # Verify sent payload
        kwargs = mock_post.call_args[1]
        payload = kwargs["json"]
        fields = payload["fields"]
        assert fields["project"]["key"] == "SUP"
        assert fields["issuetype"]["name"] == "Task"
        assert "Account Access" in fields["summary"]
        assert sample_text in fields["description"]
        assert "Technical Support" in fields["description"]


def test_create_jira_issue_mocked_failure():
    sample_ai_result = {
        "category": "Billing",
        "priority": "Low",
        "category_probability": "85%",
        "department": "Billing Support",
        "recommended_action": "Review duplicate invoice",
    }
    sample_text = "Duplicate charge inquiry"

    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.json.return_value = {"errorMessages": ["Field 'summary' is required"]}
    mock_resp.text = "Field 'summary' is required"

    with patch("requests.post", return_value=mock_resp):
        res = create_jira_issue(sample_ai_result, sample_text)
        assert res["success"] is False
        assert "Jira API error" in res["error"] or "failed" in res["error"]


@pytest.mark.skipif(not is_jira_configured(), reason="Jira credentials not configured")
def test_live_jira_connection():
    result = check_jira_connection()
    assert result.get("success") is True
    assert result.get("connected") is True
    assert result.get("project") == "SUP"
