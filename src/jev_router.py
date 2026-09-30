"""Jev Customer Support Ticket Router.

Uses TypeSafe System One (Jev) as the core classification and decision engine.
Evaluates customer tickets to predict:
  1. Ticket Category
  2. Priority
  3. Department
along with calibrated probabilities for each prediction.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, Optional
import typesafe_sdk
from typesafe_sdk import Choice, TypeSafeClient


# Core Classification Categories
CORE_CATEGORIES = [
    "Payment Issue",
    "Order Issue",
    "Delivery Issue",
    "Refund Request",
    "Product Issue",
    "Account Issue",
    "Technical Issue",
    "Cancellation Request",
    "Other",
]

# Priority Levels
PRIORITIES = [
    "Low",
    "Medium",
    "High",
    "Urgent",
]

# Departments
DEPARTMENTS = [
    "Billing",
    "Orders",
    "Delivery",
    "Returns & Refunds",
    "Technical Support",
    "Account Support",
    "General Support",
]

CATEGORY_CRITERIA: Dict[str, str] = {
    "Payment Issue": (
        "Unauthorized charges, failed transactions, double debits, card payment errors, "
        "or payment deducted without order confirmation."
    ),
    "Order Issue": (
        "Problems with order placement, incorrect quantities, missing items from order, "
        "or order status modifications."
    ),
    "Delivery Issue": (
        "Package delays, late deliveries, shipping courier problems, tracking numbers not updating, "
        "or lost shipments."
    ),
    "Refund Request": (
        "Customer requesting money back, inquiries about refund status, returning items for reimbursement, "
        "or refund disputes."
    ),
    "Product Issue": (
        "Damaged, defective, malfunctioning, broken items, incorrect size/model delivered, "
        "or poor product quality."
    ),
    "Account Issue": (
        "Login failures, forgotten passwords, locked accounts, two-factor authentication issues, "
        "or profile settings."
    ),
    "Technical Issue": (
        "Mobile app crashes, website bugs, 500 error codes, frozen interfaces, "
        "or system glitches."
    ),
    "Cancellation Request": (
        "Customer requesting to cancel an order, terminate a subscription, "
        "or stop dispatch prior to shipping."
    ),
    "Other": (
        "General feedback, praise, partnership inquiries, or general questions "
        "not covered by defined categories."
    ),
}

PRIORITY_CRITERIA: Dict[str, str] = {
    "Low": "General inquiries, minor questions, feedback, or non-time-sensitive issues.",
    "Medium": "Standard customer requests, typical account questions, or routine inquiries requiring normal turnaround.",
    "High": "Urgent issues disrupting customer, payment deducted without order, overdue delivery, or defective received item.",
    "Urgent": "Critical emergencies, severe financial discrepancies, total service outage, or imminent escalation.",
}

DEPARTMENT_CRITERIA: Dict[str, str] = {
    "Billing": "Payment processing, invoice disputes, duplicate charges, payment gateway failures, and financial inquiries.",
    "Orders": "Order status, order changes, missing items, and fulfillment processing.",
    "Delivery": "Logistics, couriers, tracking updates, shipment delays, and transit problems.",
    "Returns & Refunds": "Product returns, refund disbursement, exchanges, and return merchandise authorization.",
    "Technical Support": "Application crashes, website bugs, error codes, and technical troubleshooting.",
    "Account Support": "Customer login, password resets, account security, and credential recovery.",
    "General Support": "Miscellaneous questions, policy information, and general inquiries.",
}


class JevConfigurationError(Exception):
    """Raised when Jev API credentials are not found in the environment."""
    pass


class JevEmptyInputError(Exception):
    """Raised when the customer ticket text is empty or blank."""
    pass


class JevAPIError(Exception):
    """Raised when a call to Jev API fails."""
    pass


@dataclass
class TicketClassificationResult:
    """Structured result of Jev ticket classification."""
    ticket: str
    category: str
    category_probability: float
    category_probabilities: Dict[str, float]
    priority: str
    priority_probability: float
    priority_probabilities: Dict[str, float]
    department: str
    department_probability: float
    department_probabilities: Dict[str, float]
    model: str = "jev-latest"
    raw_response: Optional[Dict] = field(default=None, repr=False)


# Load environment variables from .env file if available
try:
    from dotenv import load_dotenv
    load_dotenv()
    _root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(_root_env):
        load_dotenv(dotenv_path=_root_env)
except Exception:
    pass


def get_api_key() -> Optional[str]:
    """Retrieve Jev / TypeSafe API key from environment."""
    return os.getenv("TYPESAFE_API_KEY") or os.getenv("JEV_API_KEY")


def is_jev_configured() -> bool:
    """Check if Jev API credentials are configured in the environment."""
    key = get_api_key()
    return bool(key and key.strip())


class JevRouter:
    """Ticket classification engine powered by Jev (TypeSafe System One)."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the JevRouter.

        Args:
            api_key: Optional explicit API key. Defaults to environment variable.
        """
        self.api_key = api_key or get_api_key()
        self._client: Optional[TypeSafeClient] = None

    def _get_client(self) -> TypeSafeClient:
        """Create or return an active TypeSafeClient instance."""
        if not self.api_key:
            raise JevConfigurationError(
                "Jev is not configured. Please set the TYPESAFE_API_KEY or JEV_API_KEY environment variable."
            )
        if self._client is None:
            self._client = TypeSafeClient(api_key=self.api_key)
        return self._client

    def classify(self, ticket_text: str) -> TicketClassificationResult:
        """Classify a customer support ticket using Jev.

        Predicts:
          1. Ticket Category + Probability
          2. Priority + Probability
          3. Department + Probability

        Args:
            ticket_text: The customer's message.

        Returns:
            TicketClassificationResult with predicted values and probabilities.

        Raises:
            JevEmptyInputError: If ticket_text is empty or whitespace.
            JevConfigurationError: If Jev API credentials are missing.
            JevAPIError: If the Jev API request fails.
        """
        if not ticket_text or not ticket_text.strip():
            raise JevEmptyInputError("Customer ticket text cannot be empty or whitespace only.")

        clean_text = ticket_text.strip()
        client = self._get_client()

        questions = {
            "category": Choice(
                instructions="What is the category of this customer support ticket?",
                criteria=CATEGORY_CRITERIA,
            ),
            "priority": Choice(
                instructions="What is the priority level for resolving this ticket?",
                criteria=PRIORITY_CRITERIA,
            ),
            "department": Choice(
                instructions="Which department should handle this ticket?",
                criteria=DEPARTMENT_CRITERIA,
            ),
        }

        try:
            response = client.system_one(
                state=clean_text,
                questions=questions,
            )
        except Exception as e:
            raise JevAPIError(f"Jev API call failed: {str(e)}") from e

        # Extract Category
        cat_ans = response.answers.get("category")
        if not cat_ans:
            raise JevAPIError("Jev response missing 'category' answer.")
        category = cat_ans.choice
        cat_probs = cat_ans.probabilities or {}
        # Use probability of chosen option if available, otherwise confidence
        cat_prob = cat_probs.get(category, getattr(cat_ans, "confidence", 1.0))

        # Extract Priority
        pri_ans = response.answers.get("priority")
        if not pri_ans:
            raise JevAPIError("Jev response missing 'priority' answer.")
        priority = pri_ans.choice
        pri_probs = pri_ans.probabilities or {}
        pri_prob = pri_probs.get(priority, getattr(pri_ans, "confidence", 1.0))

        # Extract Department
        dept_ans = response.answers.get("department")
        if not dept_ans:
            raise JevAPIError("Jev response missing 'department' answer.")
        department = dept_ans.choice
        dept_probs = dept_ans.probabilities or {}
        dept_prob = dept_probs.get(department, getattr(dept_ans, "confidence", 1.0))

        return TicketClassificationResult(
            ticket=clean_text,
            category=category,
            category_probability=float(cat_prob),
            category_probabilities=cat_probs,
            priority=priority,
            priority_probability=float(pri_prob),
            priority_probabilities=pri_probs,
            department=department,
            department_probability=float(dept_prob),
            department_probabilities=dept_probs,
            model=getattr(response, "model", "jev-latest"),
        )
