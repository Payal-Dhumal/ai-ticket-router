"""FastAPI backend for AI Customer Support Ticket Router.

Exposes REST APIs for single-ticket and batch classification using TypeSafe Jev.
Serves the React frontend in production.
"""

import io
import os
import sys
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pandas as pd

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.jev_router import (
    JevAPIError,
    JevConfigurationError,
    JevEmptyInputError,
    JevRouter,
    is_jev_configured,
)
from src.probability import format_percentage
from src.ticket_processor import TicketProcessor
from src.utils import CSVValidationError, convert_df_to_csv_bytes, validate_and_load_csv

app = FastAPI(title="AI Customer Support Ticket Router API", version="1.0.0")

# Enable CORS for local Vite dev server (port 5173) and any local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClassifyRequest(BaseModel):
    ticket: str
    threshold: float = 0.70


class BatchItem(BaseModel):
    ticket_id: Optional[str] = None
    ticket: str


class BatchRequest(BaseModel):
    tickets: List[BatchItem]
    threshold: float = 0.70


# In-memory storage for real processed tickets
processed_tickets_store: List[Dict[str, Any]] = []


@app.get("/api/status")
def get_status() -> Dict[str, Any]:
    """Check Jev configuration status."""
    configured = is_jev_configured()
    return {
        "configured": configured,
        "model": "TypeSafe System One (Jev)",
        "service": "AI Customer Support Ticket Router",
    }


@app.get("/api/tickets")
def get_tickets() -> Dict[str, Any]:
    """Return all real processed tickets and metrics from active session."""
    return {
        "total_analyzed": len(processed_tickets_store),
        "tickets": processed_tickets_store,
    }


@app.delete("/api/tickets")
def clear_tickets() -> Dict[str, Any]:
    """Clear all processed tickets from active session."""
    processed_tickets_store.clear()
    return {"message": "All tickets cleared.", "total_analyzed": 0}


@app.post("/api/classify")
def classify_ticket(req: ClassifyRequest) -> Dict[str, Any]:
    """Classify a single support ticket."""
    if not req.ticket or not req.ticket.strip():
        raise HTTPException(status_code=400, detail="Customer message cannot be empty.")

    if not is_jev_configured():
        raise HTTPException(
            status_code=503,
            detail="Jev is not configured. Please set TYPESAFE_API_KEY environment variable.",
        )

    try:
        router = JevRouter()
        processor = TicketProcessor(router=router)
        result = processor.process_ticket(req.ticket.strip(), threshold=req.threshold)
        
        # Save real ticket record to store
        record = {
            "ticket_id": f"TICK-{len(processed_tickets_store) + 1:04d}",
            "ticket": req.ticket.strip(),
            "category": result.get("category"),
            "confidence": result.get("confidence") or result.get("probability", "0%"),
            "confidence_num": result.get("confidence_raw") or result.get("category_probability_raw", 0.8),
            "priority": result.get("priority"),
            "department": result.get("department"),
            "status": "Review" if result.get("is_low_confidence") else "Routed",
            "created_at": "Just now",
            "recommended_action": result.get("recommended_action", ""),
        }
        processed_tickets_store.insert(0, record)
        return result
    except JevEmptyInputError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except JevConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except JevAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@app.get("/api/sample-tickets")
def get_sample_tickets() -> List[Dict[str, str]]:
    """Return quick sample suggestions for single ticket input."""
    return [
        {
            "tag": "Payment Issue",
            "message": "I was charged twice for order #49281. Please refund the duplicate transaction immediately.",
        },
        {
            "tag": "Delivery",
            "message": "My package has not arrived and tracking says delivered yesterday. Where is it?",
        },
        {
            "tag": "Refund Request",
            "message": "I would like to return the damaged item I received last week and request a full refund.",
        },
        {
            "tag": "Technical Support",
            "message": "The mobile application crashes every time I open the checkout screen.",
        },
        {
            "tag": "Account Access",
            "message": "I am locked out of my account and not receiving the password reset email.",
        },
        {
            "tag": "Product Inquiry",
            "message": "Can you confirm if this laptop bag is waterproof and fits a 15-inch MacBook Pro?",
        },
    ]


@app.post("/api/batch-sample")
def process_sample_batch(limit: int = 15, threshold: float = 0.70) -> Dict[str, Any]:
    """Process a subset of the built-in 110-ticket evaluation dataset."""
    sample_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "sample_tickets.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Built-in sample dataset not found.")

    if not is_jev_configured():
        raise HTTPException(status_code=503, detail="Jev is not configured.")

    try:
        df = validate_and_load_csv(sample_path)
        batch_subset = df.head(limit)
        router = JevRouter()
        processor = TicketProcessor(router=router)
        processed_df = processor.process_batch(batch_subset, threshold=threshold)
        records = processed_df.to_dict(orient="records")
        # Save real batch tickets to store
        for r in records:
            norm_record = {
                "ticket_id": r.get("ticket_id") or f"TICK-{len(processed_tickets_store) + 1:04d}",
                "ticket": r.get("ticket", ""),
                "category": r.get("category"),
                "confidence": r.get("probability", "0%"),
                "confidence_num": r.get("category_probability_raw", 0.8),
                "priority": r.get("priority"),
                "department": r.get("department"),
                "status": "Review" if r.get("is_low_confidence") else "Routed",
                "created_at": "Just now",
                "recommended_action": r.get("recommended_action", ""),
            }
            processed_tickets_store.insert(0, norm_record)
        return {
            "total_processed": len(records),
            "records": records,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


@app.post("/api/batch-upload")
async def process_batch_upload(
    file: UploadFile = File(...),
    threshold: float = 0.70,
    limit: int = 25,
) -> Dict[str, Any]:
    """Upload CSV and classify tickets."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    if not is_jev_configured():
        raise HTTPException(status_code=503, detail="Jev is not configured.")

    contents = await file.read()
    try:
        buffer = io.BytesIO(contents)
        df = validate_and_load_csv(buffer)
    except CSVValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    try:
        batch_subset = df.head(limit) if len(df) > limit else df
        router = JevRouter()
        processor = TicketProcessor(router=router)
        processed_df = processor.process_batch(batch_subset, threshold=threshold)
        records = processed_df.to_dict(orient="records")
        for r in records:
            norm_record = {
                "ticket_id": r.get("ticket_id") or f"TICK-{len(processed_tickets_store) + 1:04d}",
                "ticket": r.get("ticket", ""),
                "category": r.get("category"),
                "confidence": r.get("probability", "0%"),
                "confidence_num": r.get("category_probability_raw", 0.8),
                "priority": r.get("priority"),
                "department": r.get("department"),
                "status": "Review" if r.get("is_low_confidence") else "Routed",
                "created_at": "Just now",
                "recommended_action": r.get("recommended_action", ""),
            }
            processed_tickets_store.insert(0, norm_record)
        return {
            "total_processed": len(records),
            "records": records,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


# Serve built React frontend if dist directory exists
dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
