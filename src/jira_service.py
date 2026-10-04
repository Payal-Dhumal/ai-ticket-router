"""Jira Cloud REST API integration service for SupportRoute."""

import os
from typing import Any, Dict, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

# Priority mapping: Jev router priority -> Jira Cloud priority
PRIORITY_MAPPING = {
    "Urgent": "Highest",
    "High": "High",
    "Medium": "Medium",
    "Low": "Low",
}


def get_jira_config() -> Dict[str, Optional[str]]:
    """Retrieve Jira Cloud credentials from environment."""
    return {
        "url": (os.getenv("JIRA_URL") or "").strip().rstrip("/"),
        "email": (os.getenv("JIRA_EMAIL") or "").strip(),
        "token": (os.getenv("JIRA_API_TOKEN") or "").strip(),
        "project_key": (os.getenv("JIRA_PROJECT_KEY") or "SUP").strip().upper(),
    }


def is_jira_configured() -> bool:
    """Check if all required Jira Cloud credentials are present."""
    cfg = get_jira_config()
    return bool(cfg["url"] and cfg["email"] and cfg["token"] and cfg["project_key"])


def map_priority_to_jira(priority: Optional[str]) -> str:
    """Map Jev classification priority to Jira issue priority."""
    if not priority:
        return "Medium"
    norm = priority.strip().capitalize()
    return PRIORITY_MAPPING.get(norm, "Medium")


def test_jira_connection() -> Dict[str, Any]:
    """Test connection and authentication to Jira Cloud REST API."""
    cfg = get_jira_config()
    if not is_jira_configured():
        return {
            "success": False,
            "connected": False,
            "error": "Jira configuration missing. Please verify JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY.",
        }

    try:
        url = f"{cfg['url']}/rest/api/2/myself"
        resp = requests.get(url, auth=(cfg["email"], cfg["token"]), timeout=8)
        if resp.status_code == 200:
            user_data = resp.json()
            return {
                "success": True,
                "connected": True,
                "user": user_data.get("displayName") or user_data.get("name") or cfg["email"],
                "project": cfg["project_key"],
                "url": cfg["url"],
            }
        elif resp.status_code == 401:
            return {
                "success": False,
                "connected": False,
                "error": "Jira authentication failed. Please check JIRA_EMAIL and JIRA_API_TOKEN.",
            }
        else:
            return {
                "success": False,
                "connected": False,
                "error": f"Jira returned status code {resp.status_code}: {resp.text[:200]}",
            }
    except Exception as e:
        return {
            "success": False,
            "connected": False,
            "error": f"Failed to connect to Jira: {str(e)}",
        }


def create_jira_issue(
    ai_result: Dict[str, Any],
    ticket_text: Optional[str] = None,
    issue_type: str = "Task",
) -> Dict[str, Any]:
    """Create a Jira Cloud issue using real AI analysis results.

    Args:
        ai_result: Dictionary returned from JevRouter / TicketProcessor.
        ticket_text: Optional explicit raw customer message text.
        issue_type: Jira issue type name (default: "Task").

    Returns:
        Dictionary with success status, issue key, and direct URL.
    """
    cfg = get_jira_config()
    if not is_jira_configured():
        return {
            "success": False,
            "error": "Jira credentials are not configured in environment.",
        }

    category = ai_result.get("category", "General Inquiry")
    priority = ai_result.get("priority", "Medium")
    department = ai_result.get("department", "General Support")
    confidence = ai_result.get("category_probability") or ai_result.get("confidence") or "N/A"
    status_text = ai_result.get("status", "Routed")
    action = ai_result.get("recommended_action", "Review and respond")
    message = ticket_text or ai_result.get("ticket", "")

    # Clean summary (max 255 chars for Jira)
    summary = f"{category} - Customer Support Request"
    if len(summary) > 250:
        summary = summary[:247] + "..."

    # Structured description
    description = (
        f"Customer Support Request (AI Classified by SupportRoute)\n\n"
        f"Original Customer Message:\n"
        f"{message}\n\n"
        f"AI Analysis Result:\n"
        f"- Intent / Category: {category}\n"
        f"- Priority: {priority}\n"
        f"- Confidence: {confidence}\n"
        f"- Recommended Team: {department}\n"
        f"- Routing Decision: {status_text}\n"
        f"- Action Guidance: {action}\n"
    )

    jira_priority = map_priority_to_jira(priority)

    payload = {
        "fields": {
            "project": {"key": cfg["project_key"]},
            "summary": summary,
            "description": description,
            "issuetype": {"name": issue_type},
            "priority": {"name": jira_priority},
        }
    }

    try:
        url = f"{cfg['url']}/rest/api/2/issue"
        resp = requests.post(
            url,
            json=payload,
            auth=(cfg["email"], cfg["token"]),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=10,
        )

        if resp.status_code in (200, 201):
            data = resp.json()
            issue_key = data.get("key")
            issue_id = data.get("id")
            # Link to the Jira Service Management All Work list view with the issue selected in drawer
            list_url = f"{cfg['url']}/jira/servicedesk/projects/{cfg['project_key']}/list?selectedIssue={issue_key}"
            browse_url = f"{cfg['url']}/browse/{issue_key}"
            return {
                "success": True,
                "issue_key": issue_key,
                "issue_id": issue_id,
                "issue_url": list_url,
                "list_url": list_url,
                "browse_url": browse_url,
                "project_key": cfg["project_key"],
            }
        else:
            err_msg = resp.text
            try:
                err_json = resp.json()
                err_msg = "; ".join(err_json.get("errorMessages", [])) or str(err_json.get("errors", {}))
            except Exception:
                pass
            return {
                "success": False,
                "error": f"Jira API error ({resp.status_code}): {err_msg}",
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to contact Jira: {str(e)}",
        }
