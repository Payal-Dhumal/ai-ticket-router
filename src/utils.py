"""Utility functions for CSV processing, data validation, metrics computation, and exports."""

import io
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd


class CSVValidationError(Exception):
    """Raised when uploaded or provided CSV file is invalid or missing required columns."""
    pass


def validate_and_load_csv(file_or_path: Any) -> pd.DataFrame:
    """Load and validate customer tickets from a CSV file or buffer.

    Requires at least a 'ticket' column. If 'ticket_id' is missing, it will be
    generated automatically.

    Args:
        file_or_path: File path string or file-like buffer (e.g. Streamlit UploadedFile).

    Returns:
        Cleaned pd.DataFrame with normalized columns: 'ticket_id' and 'ticket'.

    Raises:
        CSVValidationError: If CSV cannot be parsed or lacks required content.
    """
    try:
        if isinstance(file_or_path, str):
            df = pd.read_csv(file_or_path)
        else:
            # File-like object / UploadedFile
            df = pd.read_csv(file_or_path)
    except Exception as e:
        raise CSVValidationError(f"Could not read CSV file: {str(e)}") from e

    if df.empty:
        raise CSVValidationError("The uploaded CSV file is empty.")

    # Normalize column names (strip whitespace and lower case for matching)
    col_map = {str(col).strip().lower(): col for col in df.columns}

    # Locate ticket text column
    ticket_col = None
    for candidate in ["ticket", "ticket_text", "message", "customer_message", "text", "description"]:
        if candidate in col_map:
            ticket_col = col_map[candidate]
            break

    if ticket_col is None:
        raise CSVValidationError(
            f"CSV file must contain a 'ticket' column. Found columns: {list(df.columns)}"
        )

    # Locate or generate ticket_id column
    id_col = None
    for candidate in ["ticket_id", "id", "ticketid"]:
        if candidate in col_map:
            id_col = col_map[candidate]
            break

    cleaned_df = pd.DataFrame()
    if id_col is not None:
        cleaned_df["ticket_id"] = df[id_col].astype(str).str.strip()
    else:
        cleaned_df["ticket_id"] = [f"TICK-{i+1:04d}" for i in range(len(df))]

    cleaned_df["ticket"] = df[ticket_col].astype(str).str.strip()

    # Filter out empty ticket rows
    cleaned_df = cleaned_df[cleaned_df["ticket"] != ""]
    if cleaned_df.empty:
        raise CSVValidationError("All rows in the CSV file have empty ticket text.")

    cleaned_df.reset_index(drop=True, inplace=True)
    return cleaned_df


def compute_dashboard_metrics(df: pd.DataFrame, threshold: float = 0.70) -> Dict[str, Any]:
    """Compute aggregate statistics for Tab 3 dashboard.

    Args:
        df: DataFrame containing classified tickets.
        threshold: Confidence threshold float (0.0 to 1.0).

    Returns:
        Dictionary containing metric summaries and distributions.
    """
    total = len(df)
    if total == 0:
        return {
            "total_tickets": 0,
            "average_probability": 0.0,
            "high_urgent_count": 0,
            "low_confidence_count": 0,
            "category_counts": {},
            "priority_counts": {},
            "department_counts": {},
            "low_confidence_records": pd.DataFrame(),
        }

    # Probabilities
    # Handle numeric or string formatted probabilities
    prob_col = "category_probability_raw" if "category_probability_raw" in df.columns else "category_probability"
    if prob_col in df.columns:
        probs = pd.to_numeric(df[prob_col], errors="coerce").fillna(0.0)
    else:
        probs = pd.Series([1.0] * total)

    avg_prob = float(probs.mean())

    # Priority counts
    priority_col = "priority" if "priority" in df.columns else "Priority"
    if priority_col in df.columns:
        pri_series = df[priority_col].astype(str)
        high_urgent_count = int(pri_series.isin(["High", "Urgent"]).sum())
        priority_counts = pri_series.value_counts().to_dict()
    else:
        high_urgent_count = 0
        priority_counts = {}

    # Category counts
    cat_col = "category" if "category" in df.columns else "Category"
    category_counts = df[cat_col].value_counts().to_dict() if cat_col in df.columns else {}

    # Department counts
    dept_col = "department" if "department" in df.columns else "Department"
    department_counts = df[dept_col].value_counts().to_dict() if dept_col in df.columns else {}

    # Low-confidence records
    low_conf_mask = probs < threshold
    low_conf_count = int(low_conf_mask.sum())
    low_conf_df = df[low_conf_mask].copy()

    return {
        "total_tickets": total,
        "average_probability": avg_prob,
        "high_urgent_count": high_urgent_count,
        "low_confidence_count": low_conf_count,
        "category_counts": category_counts,
        "priority_counts": priority_counts,
        "department_counts": department_counts,
        "low_confidence_records": low_conf_df,
    }


def convert_df_to_csv_bytes(df: pd.DataFrame) -> bytes:
    """Convert a DataFrame to UTF-8 encoded CSV bytes for Streamlit download button.

    Args:
        df: DataFrame to serialize.

    Returns:
        CSV content as bytes.
    """
    output = io.StringIO()
    df.to_csv(output, index=False)
    return output.getvalue().encode("utf-8")
