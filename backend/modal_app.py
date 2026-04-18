import modal
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# Define the Image with dependencies
image = modal.Image.debian_slim().pip_install("firebase-admin", "pydantic")

app = modal.App("aeris-backend")

# Define Data Models
class Location(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    source: str = "map_pin"

class ReportPayload(BaseModel):
    reportId: str = Field(..., description="Unique ID for the report")
    userId: str
    category: Literal["police", "medical", "rescue", "violation"]
    description: str
    additionalInfo: Optional[str] = None
    imageUrl: Optional[str] = None
    incidentLocation: Location
    reporterLocation: Optional[Location] = None
    timestamp: Optional[str] = None

@app.function(image=image)
@modal.web_endpoint(method="POST", label="submit-report")
def submit_report(payload: ReportPayload):
    """
    Endpoint to receive reports/emergencies.
    This serves as the 'Serverless Engine' entry point.
    """
    # TODO: Initialize Firebase Admin SDK
    # TODO: Validate Data (Pydantic handles types and enums)
    # TODO: Dispatch Logic (Alerts, etc.)
    
    print(f"Received Report: {payload.reportId} [{payload.category}]")
    
    return {
        "status": "success", 
        "message": "Report received by AERIS Engine",
        "reportId": payload.reportId
    }

@app.function(image=image)
@modal.web_endpoint(method="POST", label="trigger-sos")
def trigger_sos(user_id: str, location: Location):
    """
    High-priority endpoint for SOS signals.
    """
    print(f"SOS Triggered by {user_id} at {location}")
    return {"status": "alert_sent"}
