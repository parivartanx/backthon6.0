from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Union
from app.agents.orchestrator import run_verification_orchestrator
from app.schemas.orchestrator import ContextBundle
from app.schemas.audit import PrescriptionAuditRequest, AuditResult
from app.schemas.extract import PrescriptionExtractionResponse
from app.engine.scoring import audit_prescription
from app.agents.rag_audit import audit_prescription_rag_first
from app.core.config import settings
from app.services.extract_service import extract_prescription_from_image
from app.services.audit_service import record_audit
from app.services.signature_service import compute_audit_signature, canonicalize_audit_input
from app.services.audit_cache_service import get_cached_audit, save_cached_audit
from app.services.latency import LatencyService

router = APIRouter()

@router.post("", response_model=Union[AuditResult, ContextBundle])
@router.post("/", response_model=Union[AuditResult, ContextBundle])
def audit_prescription_endpoint(request: PrescriptionAuditRequest):
    """
    Audit a prescription against the clinical verification pipeline.
    [PATTERN: Cache-Aside]
    1. Computes deterministic SHA-256 signature of exact input details.
    2. Searches database cache first: if exact match found, returns cached evaluation immediately.
    3. If cache miss: executes Hybrid RAG-First verification engine, persists result to cache,
       and records audit telemetry.
    """
    try:
        # [PATTERN: Cache-Aside] Check database for exact input signature cache first
        sig = compute_audit_signature(request)
        cached_result = get_cached_audit(sig)
        if cached_result is not None:
            if isinstance(cached_result, AuditResult):
                record_audit(request, cached_result, signature=sig)
            return cached_result

        if request.patient and request.prescription_lines:
            # 2. Hybrid RAG-First verification engine with safety guard & offline fallback
            stage_name = "rag_first_verification" if settings.OPENROUTER_API_KEY else "deterministic_verification"
            sla_target = LatencyService.DEFAULT_RAG_SLA_MS if settings.OPENROUTER_API_KEY else LatencyService.DEFAULT_DETERMINISTIC_SLA_MS
            with LatencyService.profile_stage(
                stage_name,
                sla_limit_ms=sla_target,
            ):
                result = audit_prescription_rag_first(
                    patient=request.patient,
                    prescription_lines=request.prescription_lines,
                    canonical_syndrome=request.canonical_syndrome,
                    has_culture_report=request.has_culture_report,
                    has_positive_microbiology=request.has_positive_microbiology,
                    is_outpatient=request.is_outpatient,
                )

            result.signature = sig
            result.is_cached = False

            # 3. Store result in database cache for future identical queries
            canonical_input = canonicalize_audit_input(request)
            save_cached_audit(sig, canonical_input, result)

            # 4. Record audit run in database for dashboard surveillance
            record_audit(request, result, signature=sig)

            return result

        elif request.scenario:
            # Hybrid RAG Agent Orchestrator (<3000ms latency SLA)
            with LatencyService.profile_stage(
                "rag_orchestrator",
                sla_limit_ms=LatencyService.DEFAULT_RAG_SLA_MS,
            ):
                context = run_verification_orchestrator(request.scenario)

            canonical_input = canonicalize_audit_input(request)
            save_cached_audit(sig, canonical_input, context)

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
@router.post("/from-image/", response_model=PrescriptionExtractionResponse)
@router.post("/from-document", response_model=PrescriptionExtractionResponse)
@router.post("/from-document/", response_model=PrescriptionExtractionResponse)
async def audit_prescription_from_image(file: UploadFile = File(...)):
    """
    Multimodal Vision OCR & PDF Document Extraction: Transcribe and parse a
    photographed, scanned, or digital PDF / image prescription document
    into structured clinical entities for physician review.
    """
    try:
        content_type = file.content_type or "application/octet-stream"
        filename = file.filename or ""
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        extracted = extract_prescription_from_image(
            file_bytes=file_bytes,
            content_type=content_type,
            filename=filename,
        )
        return extracted
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document prescription extraction failed: {str(e)}")

