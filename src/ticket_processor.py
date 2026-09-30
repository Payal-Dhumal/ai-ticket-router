"""Batch and single-ticket processing pipeline connecting JevRouter, probabilities, and recommendations."""

from typing import Any, Callable, Dict, List, Optional
import pandas as pd

from src.jev_router import JevRouter, TicketClassificationResult
from src.probability import format_percentage, is_low_confidence, render_ascii_bar
from src.recommendations import get_recommended_action


class TicketProcessor:
    """Processes customer support tickets sequentially or in batch using Jev."""

    def __init__(self, router: Optional[JevRouter] = None):
        """Initialize TicketProcessor with a JevRouter instance.

        Args:
            router: Optional JevRouter. If None, creates a default JevRouter.
        """
        self.router = router or JevRouter()

    def process_ticket(
        self,
        ticket_text: str,
        threshold: float = 0.70
    ) -> Dict[str, Any]:
        """Classify a single ticket and attach probability representations and recommendations.

        Args:
            ticket_text: The customer's message.
            threshold: Confidence threshold for low confidence warning (default: 0.70).

        Returns:
            Dictionary with classification, formatted probabilities, bars, and action.
        """
        result: TicketClassificationResult = self.router.classify(ticket_text)

        cat_low = is_low_confidence(result.category_probability, threshold)
        pri_low = is_low_confidence(result.priority_probability, threshold)
        dept_low = is_low_confidence(result.department_probability, threshold)
        any_low = cat_low or pri_low or dept_low

        action = get_recommended_action(result.category)

        status_text = (
            "Low confidence — manual review recommended."
            if any_low
            else "High confidence prediction"
        )

        return {
            "ticket": result.ticket,
            "category": result.category,
            "category_probability": format_percentage(result.category_probability),
            "category_probability_raw": result.category_probability,
            "category_bar": render_ascii_bar(result.category_probability, length=18),
            "category_probabilities": result.category_probabilities,
            "priority": result.priority,
            "priority_probability": format_percentage(result.priority_probability),
            "priority_probability_raw": result.priority_probability,
            "priority_bar": render_ascii_bar(result.priority_probability, length=18),
            "priority_probabilities": result.priority_probabilities,
            "department": result.department,
            "department_probability": format_percentage(result.department_probability),
            "department_probability_raw": result.department_probability,
            "department_bar": render_ascii_bar(result.department_probability, length=18),
            "department_probabilities": result.department_probabilities,
            "recommended_action": action,
            "is_low_confidence": any_low,
            "status": status_text,
            "model": result.model,
        }

    def process_batch(
        self,
        df: pd.DataFrame,
        threshold: float = 0.70,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> pd.DataFrame:
        """Process a collection of tickets in a DataFrame.

        Expects columns: 'ticket' (and optionally 'ticket_id').

        Args:
            df: DataFrame containing tickets.
            threshold: Confidence threshold (0.0 to 1.0).
            progress_callback: Optional callback func(current, total, status_message).

        Returns:
            Processed DataFrame with classified fields, probabilities, and recommendations.
        """
        total = len(df)
        records: List[Dict[str, Any]] = []

        for idx, row in df.iterrows():
            current_num = idx + 1
            ticket_id = str(row.get("ticket_id", f"TICK-{current_num:04d}"))
            ticket_text = str(row.get("ticket", "")).strip()

            if progress_callback:
                progress_callback(
                    current_num,
                    total,
                    f"Processing ticket {current_num}/{total} ({ticket_id})..."
                )

            if not ticket_text:
                continue

            try:
                processed = self.process_ticket(ticket_text, threshold=threshold)
                record = {
                    "ticket_id": ticket_id,
                    "ticket": ticket_text,
                    "category": processed["category"],
                    "probability": processed["category_probability"],
                    "category_probability_raw": processed["category_probability_raw"],
                    "priority": processed["priority"],
                    "priority_probability": processed["priority_probability"],
                    "priority_probability_raw": processed["priority_probability_raw"],
                    "department": processed["department"],
                    "department_probability": processed["department_probability"],
                    "department_probability_raw": processed["department_probability_raw"],
                    "recommended_action": processed["recommended_action"],
                    "is_low_confidence": processed["is_low_confidence"],
                    "status": processed["status"],
                    "model": processed["model"],
                }
            except Exception as e:
                # Fallback for an individual ticket failure
                record = {
                    "ticket_id": ticket_id,
                    "ticket": ticket_text,
                    "category": "Other",
                    "probability": "0%",
                    "category_probability_raw": 0.0,
                    "priority": "Medium",
                    "priority_probability": "0%",
                    "priority_probability_raw": 0.0,
                    "department": "General Support",
                    "department_probability": "0%",
                    "department_probability_raw": 0.0,
                    "recommended_action": f"Error during processing: {str(e)}",
                    "is_low_confidence": True,
                    "status": "Low confidence — manual review recommended.",
                    "model": "unknown",
                }

            records.append(record)

        return pd.DataFrame(records)
