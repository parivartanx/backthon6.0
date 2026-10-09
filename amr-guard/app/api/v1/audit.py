from fastapi import APIRouter, HTTPException
from typing import Union
from app.agents.orchestrator import run_verification_orchestrator
from app.schemas.orchestrator import ContextBundle
from app.schemas.audit import PrescriptionAuditRequest, AuditResult
from app.engine.scoring import audit_prescription

router = APIRouter()

@router.post("/", response_model=Union[AuditResult, ContextBundle])
def audit_prescription_endpoint(request: PrescriptionAuditRequest):
    """
    Audit a prescription against the Five-Tier Verification Pipeline.
    If structured patient & prescription_lines are provided, runs the pure-Python
    deterministic core and returns an AuditResult.
    If only an unstructured scenario is provided, triggers the Hybrid RAG Orchestrator.
    """
    try:
        if request.patient and request.prescription_lines:
            # Pure deterministic verification engine (<5ms latency)
            result = audit_prescription(
                patient=request.patient,
                prescription_lines=request.prescription_lines,
                canonical_syndrome=request.canonical_syndrome,
                has_culture_report=request.has_culture_report,
                has_positive_microbiology=request.has_positive_microbiology,
                is_outpatient=request.is_outpatient,
            )
            return result
        elif request.scenario:
            # Hybrid RAG Agent Orchestrator
            context = run_verification_orchestrator(request.scenario)
            return context
        else:
            raise HTTPException(
                status_code=400,
                detail="Request must provide either structured patient & prescription_lines or a scenario."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/from-image")
def audit_prescription_from_image():
    """Stub: audit from image."""
    return {"todo": True}
