from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.prescription import PrescriptionCase
from app.services.prescription_service import (
    get_all_prescriptions,
    get_prescription_by_id,
    save_prescription,
)

router = APIRouter()


@router.get("", response_model=List[PrescriptionCase])
@router.get("/", response_model=List[PrescriptionCase])
def list_prescriptions():
    """
    Fetch all active clinical prescription cases, combining live database
    audits, active doctor session entries, and calibrated clinical baseline presets.
    """
    try:
        return get_all_prescriptions()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch prescriptions: {str(e)}"
        )


@router.get("/{case_id}", response_model=PrescriptionCase)
def get_prescription(case_id: str):
    """
    Get a single prescription case by its unique case identifier (e.g., CASE-2026-0891).
    """
    case = get_prescription_by_id(case_id)
    if not case:
        raise HTTPException(
            status_code=404,
            detail=f"Prescription case '{case_id}' not found"
        )
    return case


@router.post("", response_model=PrescriptionCase)
@router.post("/", response_model=PrescriptionCase)
def create_prescription(case: PrescriptionCase):
    """
    Create and ingest a new prescription case. Automatically executes the deterministic
    Five-Tier clinical verification pipeline (<5ms latency SLA) and records audit telemetry.
    """
    try:
        return save_prescription(case)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create prescription: {str(e)}"
        )


@router.put("/{case_id}", response_model=PrescriptionCase)
def update_prescription(case_id: str, case: PrescriptionCase):
    """
    Update an existing prescription case, re-evaluating safety rules and updating the audit log.
    """
    try:
        case.id = case_id
        return save_prescription(case)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update prescription '{case_id}': {str(e)}"
        )
