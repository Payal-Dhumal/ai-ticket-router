"""AI Customer Support Ticket Router.

Modern SaaS interface powered by TypeSafe System One (Jev).
"""

import os
import sys
from typing import Optional
import pandas as pd
import streamlit as st

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.jev_router import (
    CORE_CATEGORIES,
    DEPARTMENTS,
    PRIORITIES,
    JevAPIError,
    JevConfigurationError,
    JevEmptyInputError,
    JevRouter,
    is_jev_configured,
)
from src.probability import format_percentage, is_low_confidence
from src.recommendations import get_recommended_action
from src.ticket_processor import TicketProcessor
from src.utils import CSVValidationError, convert_df_to_csv_bytes, validate_and_load_csv


# Page configuration with centered layout
st.set_page_config(
    page_title="Ticket Router",
    layout="centered",
    initial_sidebar_state="expanded",
)

# High-contrast, modern dark SaaS styling
st.markdown(
    """
    <style>
    /* Global Base */
    .block-container {
        padding-top: 2rem !important;
        padding-bottom: 3.5rem !important;
    }
    
    /* Header */
    .saas-header {
        margin-bottom: 1.5rem;
    }
    .saas-title {
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #ffffff !important;
        margin-bottom: 0.3rem;
    }
    .saas-subtitle {
        font-size: 0.92rem;
        color: #94a3b8 !important;
        margin: 0;
    }

    /* Tabs Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 1.5rem;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 8px 4px;
        font-size: 0.92rem;
        font-weight: 500;
        color: #94a3b8;
        background-color: transparent !important;
        border: none !important;
    }
    .stTabs [aria-selected="true"] {
        color: #ffffff !important;
        font-weight: 600 !important;
        border-bottom: 2px solid #3b82f6 !important;
    }

    /* Input area */
    .stTextArea textarea {
        background-color: #131b2e !important;
        color: #f8fafc !important;
        border: 1px solid rgba(255, 255, 255, 0.14) !important;
        border-radius: 8px !important;
        font-size: 0.95rem !important;
        line-height: 1.5 !important;
        padding: 12px 14px !important;
    }
    .stTextArea textarea:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 1px #3b82f6 !important;
    }

    /* Single Selectbox Input & Dropdown */
    div[data-baseweb="select"] > div {
        background-color: #131b2e !important;
        border: 1px solid rgba(255, 255, 255, 0.14) !important;
        border-radius: 8px !important;
        color: #f8fafc !important;
        font-size: 0.95rem !important;
        min-height: 48px !important;
        padding-left: 4px !important;
    }
    div[data-baseweb="select"] input {
        color: #f8fafc !important;
        font-size: 0.95rem !important;
    }
    div[data-baseweb="popover"], div[data-baseweb="menu"], ul[data-baseweb="menu"] {
        background-color: #131b2e !important;
        border: 1px solid rgba(255, 255, 255, 0.14) !important;
        border-radius: 8px !important;
    }
    li[data-baseweb="menu-item"], [role="option"] {
        color: #f8fafc !important;
        font-size: 0.92rem !important;
        padding: 10px 14px !important;
        white-space: normal !important;
        word-break: break-word !important;
        line-height: 1.4 !important;
    }
    li[data-baseweb="menu-item"]:hover, [role="option"]:hover {
        background-color: rgba(59, 130, 246, 0.15) !important;
        color: #ffffff !important;
    }

    /* Primary Button */
    div.stButton > button[kind="primary"] {
        background-color: #2563eb !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        border-radius: 6px !important;
        padding: 8px 22px !important;
        border: none !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
        transition: background-color 0.15s ease !important;
    }
    div.stButton > button[kind="primary"]:hover {
        background-color: #1d4ed8 !important;
    }
    div.stButton > button:not([kind="primary"]) {
        background-color: #131b2e !important;
        color: #f8fafc !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        border-radius: 6px !important;
    }
    div.stButton > button:not([kind="primary"]):hover {
        border-color: #3b82f6 !important;
        color: #3b82f6 !important;
    }

    /* Analyzing / Loading Button State */
    .analyzing-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background-color: #1d4ed8 !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        border-radius: 6px !important;
        padding: 8px 22px !important;
        border: none !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
        cursor: wait !important;
        user-select: none !important;
        height: 38px;
        box-sizing: border-box;
    }
    .btn-spinner {
        width: 13px;
        height: 13px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: btn-spin 0.75s linear infinite;
        display: inline-block;
    }
    @keyframes btn-spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Analyzing Loading Panel */
    .loading-state-container {
        background: #131b2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 18px 22px;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .loading-state-header {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .loading-state-text {
        font-size: 0.92rem;
        font-weight: 500;
        color: #94a3b8;
    }
    .loading-progress-track {
        width: 100%;
        height: 3px;
        background-color: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        overflow: hidden;
        position: relative;
    }
    .loading-progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 35%;
        background: linear-gradient(90deg, transparent, #3b82f6, transparent);
        border-radius: 3px;
        animation: progress-indeterminate 1.4s ease-in-out infinite;
    }
    @keyframes progress-indeterminate {
        0% {
            left: -35%;
        }
        100% {
            left: 100%;
        }
    }

    /* Result Cards */
    .result-card {
        background: #131b2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 16px 18px;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
    }
    .card-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
        margin-bottom: 6px;
    }
    .card-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 4px;
        line-height: 1.3;
    }
    .card-prob {
        font-size: 0.9rem;
        font-weight: 600;
        color: #60a5fa;
    }

    /* Action Panel */
    .action-panel {
        background: #131b2e;
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-left: 3px solid #3b82f6;
        border-radius: 6px;
        padding: 12px 16px;
        margin-top: 14px;
    }
    .action-panel-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
        display: block;
        margin-bottom: 3px;
    }
    .action-panel-text {
        font-size: 0.92rem;
        color: #f1f5f9;
        margin: 0;
    }

    /* Status Notifications */
    .notice-warning {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-left: 3px solid #ef4444;
        color: #fca5a5;
        border-radius: 6px;
        padding: 10px 14px;
        font-size: 0.88rem;
        font-weight: 500;
        margin-top: 12px;
    }

    /* Sidebar Status */
    .sidebar-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88rem;
        color: #f8fafc;
        margin-bottom: 1.2rem;
    }
    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #10b981;
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    }
    .status-dot-off {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ef4444;
        box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Session state initialization
if "batch_classified_df" not in st.session_state:
    st.session_state.batch_classified_df = None

if "single_analysis" not in st.session_state:
    st.session_state.single_analysis = None

# Sidebar (Minimal configuration)
st.sidebar.markdown("#### Configuration")

jev_active = is_jev_configured()
if jev_active:
    st.sidebar.markdown(
        """
        <div class="sidebar-status">
            <span class="status-dot"></span>
            <span>Jev Connected</span>
        </div>
        """,
        unsafe_allow_html=True,
    )
else:
    st.sidebar.markdown(
        """
        <div class="sidebar-status">
            <span class="status-dot-off"></span>
            <span>Jev Disconnected</span>
        </div>
        """,
        unsafe_allow_html=True,
    )
    api_key_input = st.sidebar.text_input("API Key", type="password")
    if api_key_input:
        os.environ["TYPESAFE_API_KEY"] = api_key_input
        jev_active = True
        st.sidebar.caption("Key configured.")

threshold_input = st.sidebar.slider(
    "Confidence Threshold (%)",
    min_value=50,
    max_value=95,
    value=70,
    step=5,
    help="Predictions below this confidence trigger a manual review recommendation.",
)
confidence_threshold = threshold_input / 100.0

# Header
st.markdown(
    """
    <div class="saas-header">
        <div class="saas-title">Customer Support Ticket Router</div>
        <div class="saas-subtitle">Automated classification, priority evaluation, and department routing.</div>
    </div>
    """,
    unsafe_allow_html=True,
)

# Clean 2-tab navigation
tab_single, tab_batch = st.tabs(["Single Ticket Analysis", "Batch Analysis"])


# ==========================================
# 1. SINGLE TICKET ANALYSIS
# ==========================================
with tab_single:
    # Display any pending error/warning from previous analysis attempt
    if "analysis_error" in st.session_state and st.session_state.analysis_error:
        if st.session_state.get("analysis_error_type") == "warning":
            st.warning(st.session_state.analysis_error)
        else:
            st.error(st.session_state.analysis_error)
        st.session_state.analysis_error = None
        st.session_state.analysis_error_type = None

    SAMPLE_TICKETS = [
        "I was charged twice for order #49281. Please refund the duplicate transaction immediately.",
        "My package has not arrived and tracking says delivered yesterday. Where is it?",
        "I would like to return the damaged item I received last week and request a full refund.",
        "The mobile application crashes every time I open the checkout screen.",
        "I am locked out of my account and not receiving the password reset email.",
        "Can you confirm if this charger is compatible with the latest model?",
    ]

    ticket_input = st.selectbox(
        label="Customer Support Message",
        options=SAMPLE_TICKETS,
        index=None,
        placeholder="Enter customer support message",
        accept_new_options=True,
        label_visibility="collapsed",
    )

    btn_placeholder = st.empty()
    loading_placeholder = st.empty()

    if btn_placeholder.button("Analyze Ticket", type="primary"):
        cleaned_input = str(ticket_input).strip() if ticket_input else ""
        if not cleaned_input:
            st.warning("Customer message cannot be empty.")
        elif not is_jev_configured():
            st.error("Jev is not configured.")
        else:
            # Immediately clear prior results so they don't linger during analysis
            st.session_state.single_analysis = None

            # Render button loading state
            btn_placeholder.markdown(
                """
                <div class="analyzing-btn">
                    <span class="btn-spinner"></span>
                    <span>Analyzing with Jev...</span>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Render smooth animated progress indicator
            loading_placeholder.markdown(
                """
                <div class="loading-state-container">
                    <div class="loading-state-header">
                        <span class="btn-spinner"></span>
                        <span class="loading-state-text">Analyzing with Jev...</span>
                    </div>
                    <div class="loading-progress-track">
                        <div class="loading-progress-bar"></div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            try:
                router = JevRouter()
                processor = TicketProcessor(router=router)
                result = processor.process_ticket(cleaned_input, threshold=confidence_threshold)
                st.session_state.single_analysis = result
                loading_placeholder.empty()
                st.rerun()
            except JevEmptyInputError as e:
                loading_placeholder.empty()
                st.session_state.analysis_error = str(e)
                st.session_state.analysis_error_type = "warning"
                st.rerun()
            except JevConfigurationError as e:
                loading_placeholder.empty()
                st.session_state.analysis_error = str(e)
                st.session_state.analysis_error_type = "error"
                st.rerun()
            except JevAPIError as e:
                loading_placeholder.empty()
                st.session_state.analysis_error = str(e)
                st.session_state.analysis_error_type = "error"
                st.rerun()
            except Exception as e:
                loading_placeholder.empty()
                st.session_state.analysis_error = f"Error: {str(e)}"
                st.session_state.analysis_error_type = "error"
                st.rerun()

    # Results section directly below input
    if st.session_state.single_analysis:
        res = st.session_state.single_analysis

        col_cat, col_pri, col_dept = st.columns(3)

        # Category Card
        with col_cat:
            cat_pct = format_percentage(res["category_probability_raw"])
            st.markdown(
                f"""
                <div class="result-card">
                    <div style="min-height: 18px; margin-bottom: 6px;">
                        <span class="card-label" style="margin-bottom: 0; line-height: 1;">Category</span>
                    </div>
                    <div class="card-value">{res['category']}</div>
                    <div class="card-prob">{cat_pct} confidence</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.progress(float(res["category_probability_raw"]))

        # Priority Card
        with col_pri:
            pri_pct = format_percentage(res["priority_probability_raw"])
            pri_val = str(res["priority"]).strip()
            
            priority_color_map = {
                "Low": {
                    "text": "#10b981",
                    "border": "rgba(16, 185, 129, 0.45)",
                    "badge_bg": "rgba(16, 185, 129, 0.12)",
                    "dot": "#10b981",
                },
                "Medium": {
                    "text": "#eab308",
                    "border": "rgba(234, 179, 8, 0.45)",
                    "badge_bg": "rgba(234, 179, 8, 0.12)",
                    "dot": "#eab308",
                },
                "High": {
                    "text": "#f97316",
                    "border": "rgba(249, 115, 22, 0.45)",
                    "badge_bg": "rgba(249, 115, 22, 0.12)",
                    "dot": "#f97316",
                },
                "Urgent": {
                    "text": "#ef4444",
                    "border": "rgba(239, 68, 68, 0.45)",
                    "badge_bg": "rgba(239, 68, 68, 0.12)",
                    "dot": "#ef4444",
                },
            }
            pri_theme = priority_color_map.get(
                pri_val.title(),
                {
                    "text": "#ffffff",
                    "border": "rgba(255, 255, 255, 0.1)",
                    "badge_bg": "rgba(255, 255, 255, 0.08)",
                    "dot": "#94a3b8",
                },
            )
            st.markdown(
                f"""
                <div class="result-card" style="border-color: {pri_theme['border']};">
                    <div style="display: flex; justify-content: space-between; align-items: center; min-height: 18px; margin-bottom: 6px;">
                        <span class="card-label" style="margin-bottom: 0; line-height: 1;">Priority</span>
                        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: {pri_theme['badge_bg']}; color: {pri_theme['text']}; padding: 2px 7px; border-radius: 4px; border: 1px solid {pri_theme['border']};">
                            <span style="width: 5px; height: 5px; border-radius: 50%; background-color: {pri_theme['dot']};"></span>
                            {pri_val.upper()}
                        </span>
                    </div>
                    <div class="card-value" style="color: {pri_theme['text']};">{pri_val}</div>
                    <div class="card-prob">{pri_pct} confidence</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.progress(float(res["priority_probability_raw"]))

        # Department Card
        with col_dept:
            dept_pct = format_percentage(res["department_probability_raw"])
            st.markdown(
                f"""
                <div class="result-card">
                    <div style="min-height: 18px; margin-bottom: 6px;">
                        <span class="card-label" style="margin-bottom: 0; line-height: 1;">Department</span>
                    </div>
                    <div class="card-value">{res['department']}</div>
                    <div class="card-prob">{dept_pct} confidence</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.progress(float(res["department_probability_raw"]))

        # Low Confidence Warning
        if res["is_low_confidence"]:
            st.markdown(
                """
                <div class="notice-warning">
                    Low confidence — manual review recommended.
                </div>
                """,
                unsafe_allow_html=True,
            )

        # Recommended Action Panel
        st.markdown(
            f"""
            <div class="action-panel">
                <span class="action-panel-label">Recommended Action</span>
                <p class="action-panel-text">{res['recommended_action']}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )


# ==========================================
# 2. BATCH ANALYSIS
# ==========================================
with tab_batch:
    uploaded_file = st.file_uploader(
        label="Upload CSV",
        type=["csv"],
        label_visibility="collapsed",
    )

    col_btn_run, col_btn_sample = st.columns([1, 4])
    with col_btn_run:
        run_batch_clicked = st.button("Analyze Batch", type="primary")
    with col_btn_sample:
        load_sample_clicked = st.button("Use Sample Data (110 Tickets)")

    df_source = None

    if load_sample_clicked or ("use_sample_data" in st.session_state and st.session_state.use_sample_data):
        st.session_state.use_sample_data = True
        sample_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "sample_tickets.csv")
        if os.path.exists(sample_path):
            try:
                df_source = validate_and_load_csv(sample_path)
            except Exception as e:
                st.error(f"Error loading sample file: {str(e)}")
        else:
            st.error("Sample dataset file not found.")

    if uploaded_file is not None:
        st.session_state.use_sample_data = False
        try:
            df_source = validate_and_load_csv(uploaded_file)
        except CSVValidationError as e:
            st.error(str(e))
        except Exception as e:
            st.error(f"Error: {str(e)}")

    if run_batch_clicked:
        if df_source is None:
            st.warning("Please upload a CSV file or load the sample dataset.")
        elif not is_jev_configured():
            st.error("Jev is not configured.")
        else:
            progress_bar = st.progress(0.0)
            status_placeholder = st.empty()

            def update_progress(current, total, msg):
                progress_bar.progress(current / total)
                status_placeholder.caption(f"Processing {current} of {total} tickets...")

            try:
                router = JevRouter()
                processor = TicketProcessor(router=router)
                batch_subset = df_source.head(25) if len(df_source) > 25 else df_source
                processed_df = processor.process_batch(
                    batch_subset,
                    threshold=confidence_threshold,
                    progress_callback=update_progress,
                )
                st.session_state.batch_classified_df = processed_df
                status_placeholder.empty()
                progress_bar.empty()
            except Exception as e:
                st.error(f"Batch processing failed: {str(e)}")

    # Results Table
    if st.session_state.batch_classified_df is not None:
        result_df = st.session_state.batch_classified_df

        st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

        display_columns = ["ticket", "category", "probability", "priority", "department"]
        st.dataframe(
            result_df[display_columns],
            use_container_width=True,
            hide_index=True,
            column_config={
                "ticket": st.column_config.TextColumn("Ticket", width="large"),
                "category": st.column_config.TextColumn("Category", width="medium"),
                "probability": st.column_config.TextColumn("Probability", width="small"),
                "priority": st.column_config.TextColumn("Priority", width="small"),
                "department": st.column_config.TextColumn("Department", width="medium"),
            },
        )

        csv_data = convert_df_to_csv_bytes(result_df)
        st.download_button(
            label="Download CSV",
            data=csv_data,
            file_name="classified_tickets.csv",
            mime="text/csv",
        )
