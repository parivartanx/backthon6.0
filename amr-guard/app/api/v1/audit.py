from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Union
from app.agents.orchestrator import run_verification_orchestrator
from app.schemas.orchestrator import ContextBundle
from app.schemas.audit import PrescriptionAuditRequest, AuditResult
from app.schemas.extract import PrescriptionExtractionResponse
from app.engine.scoring import audit_prescription
from app.services.extract_service import extract_prescription_from_image
from app.services.audit_service import record_audit
from app.services.latency import LatencyService

router = APIRouter()

@router.post("/", response_model=Union[AuditResult, ContextBundle])
def audit_prescription_endpoint(request: PrescriptionAuditRequest):
    """
    Audit a prescription against the Five-Tier Verification Pipeline.
    If structured patient & prescription_lines are provided, runs the pure-Python
    deterministic core, records the audit in the database, and returns an AuditResult.
    If only an unstructured scenario is provided, triggers the Hybrid RAG Orchestrator.
    """
    try:
        if request.patient and request.prescription_lines:
            # 1. Pure deterministic verification engine (<5ms latency SLA)
            with LatencyService.profile_stage(
                "deterministic_verification",
                sla_limit_ms=LatencyService.DEFAULT_DETERMINISTIC_SLA_MS,
            ):
                result = audit_prescription(
                    patient=request.patient,
                    prescription_lines=request.prescription_lines,
                    canonical_syndrome=request.canonical_syndrome,
                    has_culture_report=request.has_culture_report,
                    has_positive_microbiology=request.has_positive_microbiology,
                    is_outpatient=request.is_outpatient,
                )

            # 2. Record audit run in database for dashboard surveillance
            record_audit(request, result)

            return result

        elif request.scenario:
            # Hybrid RAG Agent Orchestrator (<3000ms latency SLA)
            with LatencyService.profile_stage(
                "rag_orchestrator",
                sla_limit_ms=LatencyService.DEFAULT_RAG_SLA_MS,
            ):
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


@router.post("/from-image", response_model=PrescriptionExtractionResponse)
async def audit_prescription_from_image(file: UploadFile = File(...)):
    """
    Multimodal Vision OCR: Transcribe and parse a photographed or scanned
    prescription image into structured clinical entities for physician review.
    """
    try:
        content_type = file.content_type or "image/jpeg"
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        extracted = extract_prescription_from_image(file_bytes, content_type)
        return extracted
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image prescription OCR failed: {str(e)}")
