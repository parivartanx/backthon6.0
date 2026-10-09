"""
Clinical Remediation Service for AMR-Guard.
Fetches data dynamically via the ReAct Agent Orchestrator with tool calling,
backed by dynamic relational SQL database and RAG guideline retrieval.
"""
from typing import Optional, List
from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.models import Condition, Regimen, Drug
from app.schemas.patient import PatientContext
from app.schemas.remediation import RemediationRequest, RemediationResponse, RemediationOption
from app.agents.orchestrator import run_remediation_orchestrator
from app.agents.tools import search_amr_guidelines
from app.engine.constraints import normalize_text, is_irrational_fdc

def _database_fallback_remediation(request: RemediationRequest) -> RemediationResponse:
    """
    Dynamic database lookup fallback if LLM agent orchestrator is offline.
    Queries the SQL tables (conditions, regimens, drugs) directly instead of static hardcoding.
    """
    syndrome = request.canonical_syndrome or (request.patient.diagnosis_text if request.patient else "Unspecified Diagnosis")
    norm_syn = normalize_text(syndrome)
    patient = request.patient or PatientContext(age_years=30, sex="unknown", is_pregnant=False)
    flagged = normalize_text(request.flagged_drug)

    db = SessionLocal()
    try:
        # 1. Look up matching Condition in database
        stmt = select(Condition).where(
            (Condition.code.ilike(f"%{norm_syn}%")) |
            (Condition.display_name.ilike(f"%{norm_syn}%"))
        )
        condition = db.execute(stmt).scalars().first()

        options: List[RemediationOption] = []
        first_line_regimen = None

        if condition:
            # 2. Query verified regimens from database
            regimen_stmt = select(Regimen).where(Regimen.condition_id == condition.id)
            regimens = db.execute(regimen_stmt).scalars().all()

            for reg in regimens:
                drug = db.get(Drug, reg.drug_id)
                if not drug:
                    continue

                # Filter contraindications based on patient profile
                is_safe = True
                if patient.is_pregnant and drug.pregnancy_contraindicated:
                    is_safe = False
                if patient.age_years < drug.min_age_years:
                    is_safe = False
                if "nitrofurantoin" in drug.generic_name.lower() and (patient.age_years >= 65 or (patient.egfr and patient.egfr < 30)):
                    is_safe = False

                if not is_safe:
                    continue

                rec_type = "MANDATE_SYMPTOMATIC" if not drug.is_antibiotic else "SWITCH_DRUG"
                suggested = f"{drug.generic_name} ({reg.dose_text} {reg.frequency} for {reg.duration_days} days)"

                if not first_line_regimen:
                    first_line_regimen = suggested

                options.append(
                    RemediationOption(
                        recommendation_type=rec_type,
                        suggested_drug=suggested,
                        suggested_duration_days=reg.duration_days,
                        guidance=f"Guideline regimen for {condition.display_name}: {drug.generic_name} ({drug.aware_class} group).",
                        source_citation=f"{reg.source} (Verified by: {reg.verified_by})"
                    )
                )

        # 3. If condition not in DB or no options found, check RRF guideline search dynamically
        if not options:
            rag_evidence = search_amr_guidelines(syndrome, limit=2)
            first_line_regimen = "Access Group Narrow-Spectrum Regimen"
            options.append(
                RemediationOption(
                    recommendation_type="SWITCH_DRUG",
                    suggested_drug="Access Group First-Line Alternative",
                    suggested_duration_days=5,
                    guidance=f"Synthesized from clinical surveillance: {rag_evidence[:180]}...",
                    source_citation="ICMR Standard Treatment Guidelines & WHO AWaRe 2023"
                )
            )

        guidance_text = (
            f"Prescription stewardship recommendation for {condition.display_name if condition else syndrome}. "
            "Prioritize narrow-spectrum Access antimicrobials and limit duration according to ICMR STGs."
        )

        return RemediationResponse(
            canonical_syndrome=condition.display_name if condition else syndrome,
            first_line_access_regimen=first_line_regimen or "Symptomatic care / Access alternative",
            options=options,
            stewardship_guidance=guidance_text,
        )
    finally:
        db.close()


def get_remediation_guidance(request: RemediationRequest) -> RemediationResponse:
    """
    Main entrypoint: Fetches remediation data via the ReAct Agent Orchestrator using tool-calling.
    Falls back dynamically to database regimens if LLM is offline.
    """
    # 1. Primary: Run LangGraph ReAct Orchestrator with autonomous tool calling
    agent_response = run_remediation_orchestrator(request)
    if agent_response and agent_response.options:
        return agent_response

    # 2. Dynamic Database & RAG Fallback
    return _database_fallback_remediation(request)
