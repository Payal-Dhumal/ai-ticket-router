"""Recommendation engine providing actionable next steps based on classified ticket categories and priorities."""

from typing import Dict, Optional


CATEGORY_RECOMMENDATIONS: Dict[str, str] = {
    "Payment Issue": "Verify payment transaction and order status.",
    "Order Issue": "Check order fulfillment, item availability, and order status.",
    "Delivery Issue": "Check shipment tracking and investigate the delivery delay.",
    "Refund Request": "Review refund eligibility and order purchase details.",
    "Product Issue": "Inspect product defect description and evaluate replacement or return.",
    "Account Issue": "Verify customer credentials and provide secure account recovery assistance.",
    "Technical Issue": "Check the reported technical problem and review error diagnostic logs.",
    "Cancellation Request": "Check whether the order can still be cancelled before dispatch.",
    "Other": "Perform initial triage to clarify customer inquiry and route accordingly."
}

PRIORITY_ACTION_HINTS: Dict[str, str] = {
    "Urgent": "Escalate immediately to on-call lead — customer experiencing critical disruption.",
    "High": "Prioritize queue assignment for same-day resolution.",
    "Medium": "Queue for standard resolution within standard SLA.",
    "Low": "Assign to normal inquiry pool for scheduled review."
}


def get_recommended_action(category: str, default: Optional[str] = None) -> str:
    """Return the recommended operational action for a given category.

    Args:
        category: The predicted ticket category name.
        default: Fallback text if category is unknown.

    Returns:
        Recommended action string.
    """
    if not category:
        return default or "Review ticket manually and route to general support."

    # Direct match or case-insensitive fallback
    if category in CATEGORY_RECOMMENDATIONS:
        return CATEGORY_RECOMMENDATIONS[category]

    for key, action in CATEGORY_RECOMMENDATIONS.items():
        if key.lower() == category.strip().lower():
            return action

    return default or "Review ticket manually and route to appropriate operational queue."


def get_priority_hint(priority: str) -> str:
    """Return operational SLA advice based on ticket priority.

    Args:
        priority: Low, Medium, High, or Urgent.

    Returns:
        Actionable operational guidance string.
    """
    if not priority:
        return ""
    for key, hint in PRIORITY_ACTION_HINTS.items():
        if key.lower() == priority.strip().lower():
            return hint
    return ""


def get_complete_recommendation(
    category: str,
    priority: str,
    is_low_confidence_flag: bool = False
) -> Dict[str, str]:
    """Assemble primary recommended action and contextual notes.

    Args:
        category: Predicted category.
        priority: Predicted priority.
        is_low_confidence_flag: Whether model confidence was below threshold.

    Returns:
        Dict with 'primary_action', 'priority_guidance', and 'review_notice'.
    """
    primary = get_recommended_action(category)
    priority_guidance = get_priority_hint(priority)
    review_notice = (
        "Model confidence is below threshold — please confirm category before executing actions."
        if is_low_confidence_flag
        else "High model confidence — automated routing recommended."
    )

    return {
        "primary_action": primary,
        "priority_guidance": priority_guidance,
        "review_notice": review_notice,
    }
