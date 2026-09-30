"""Probability formatting, thresholds, and ASCII visualization utilities for Jev predictions."""

from typing import Dict, List, Tuple


def normalize_probability(prob: float) -> float:
    """Normalize probability to a float between 0.0 and 1.0.

    Args:
        prob: Raw probability value (0.0 to 1.0 or 0 to 100).

    Returns:
        Normalized probability in [0.0, 1.0].
    """
    if prob is None:
        return 0.0
    if prob > 1.0:
        return max(0.0, min(1.0, prob / 100.0))
    return max(0.0, min(1.0, float(prob)))


def format_percentage(prob: float, decimals: int = 0) -> str:
    """Format a probability value into a clean percentage string.

    Args:
        prob: Probability value between 0.0 and 1.0 (or 0-100).
        decimals: Number of decimal places to include (default: 0).

    Returns:
        Formatted percentage string, e.g. '94%'.
    """
    norm = normalize_probability(prob)
    pct = norm * 100.0
    if decimals == 0:
        return f"{round(pct)}%"
    return f"{pct:.{decimals}f}%"


def is_low_confidence(prob: float, threshold: float = 0.70) -> bool:
    """Check if a prediction falls below the confidence threshold.

    Args:
        prob: Prediction probability/confidence.
        threshold: Confidence threshold (default: 0.70, or 70%).

    Returns:
        True if probability is strictly less than threshold, False otherwise.
    """
    norm = normalize_probability(prob)
    norm_threshold = normalize_probability(threshold)
    return norm < norm_threshold


def get_confidence_status(prob: float, threshold: float = 0.70) -> Tuple[str, str, str]:
    """Return status text, color name, and alert message based on confidence.

    Args:
        prob: Prediction probability.
        threshold: Confidence threshold.

    Returns:
        Tuple of (status_label, hex_color, advisory_message).
    """
    norm = normalize_probability(prob)
    norm_thresh = normalize_probability(threshold)

    if norm < norm_thresh:
        return (
            "Low Confidence",
            "#EF4444",
            "Low confidence — manual review recommended."
        )
    elif norm < 0.85:
        return (
            "Moderate Confidence",
            "#F59E0B",
            "Automated routing confident; standard monitoring applies."
        )
    else:
        return (
            "High Confidence",
            "#10B981",
            "High confidence prediction — ready for automated dispatch."
        )


def render_ascii_bar(prob: float, length: int = 20) -> str:
    """Generate a horizontal block bar representing probability.

    Example output for 0.91 with length 20:
        '██████████████████░░ 91%'

    Args:
        prob: Probability value between 0.0 and 1.0.
        length: Total character length of the bar (default: 20).

    Returns:
        ASCII progress bar with trailing percentage.
    """
    norm = normalize_probability(prob)
    filled_count = int(round(norm * length))
    filled_count = max(0, min(length, filled_count))
    unfilled_count = length - filled_count

    bar = "█" * filled_count + "░" * unfilled_count
    pct_text = format_percentage(norm)
    return f"{bar} {pct_text}"


def get_sorted_probabilities(probabilities: Dict[str, float]) -> List[Tuple[str, float]]:
    """Return options sorted in descending order by probability.

    Args:
        probabilities: Dictionary mapping option names to probability floats.

    Returns:
        Sorted list of (option_name, probability) tuples.
    """
    if not probabilities:
        return []
    return sorted(probabilities.items(), key=lambda item: item[1], reverse=True)


def render_distribution_bars(
    probabilities: Dict[str, float],
    top_n: int = 5,
    bar_length: int = 18
) -> List[Tuple[str, str, str]]:
    """Render top options with ascii bars for user interface visualization.

    Args:
        probabilities: Dictionary mapping option names to probability floats.
        top_n: Maximum number of options to render.
        bar_length: Character length of the bar.

    Returns:
        List of tuples: (option_name, ascii_bar, percentage_string).
    """
    sorted_items = get_sorted_probabilities(probabilities)[:top_n]
    results = []
    for option, prob in sorted_items:
        ascii_bar = render_ascii_bar(prob, length=bar_length)
        pct_str = format_percentage(prob)
        results.append((option, ascii_bar, pct_str))
    return results
