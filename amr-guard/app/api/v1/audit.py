from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.orchestrator import run_verification_orchestrator
from app.schemas.orchestrator import ContextBundle

router = APIRouter()

class AuditRequest(BaseModel):
    scenario: str

@router.post("/", response_model=ContextBundle)
def audit_prescription(request: AuditRequest):
    """
    Trigger the Hybrid RAG Orchestrator to evaluate a clinical scenario.
    """
    try:
        # 1. Orchestrator calls Hybrid RAG tools and returns a ContextBundle
        context = run_verification_orchestrator(request.scenario)
        
        # 2. In a complete flow, this ContextBundle would be passed to the 
        # Deterministic Core (app/engine/) for final scoring.
        # For now, we return the structured context directly.
        
        return context
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/from-image")
def audit_prescription_from_image():
    """Stub: audit from image."""
    return {"todo": True}
