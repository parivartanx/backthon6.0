"""
RAG-First Clinical Prescription Audit Agent for AMR-Guard.

Implements Hybrid RAG + LLM clinical analysis with deterministic safety fallbacks:
1. Pre-retrieves authoritative ICMR STG and WHO AWaRe guidelines via Hybrid RAG (BM25 + dense RRF).
2. Invokes LLM agent to evaluate clinical appropriateness, spectrum tiering, and resistance risks.
3. Applies a zero-tolerance deterministic safety net ensuring life-threatening contraindications are never missed.
4. Provides 100% graceful offline fallback to the deterministic engine when LLM APIs are unreachable.
"""
import time
import json
import logging
from typing import List, Optional, Dict, Any
from openai import OpenAI

from app.core.config import settings
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.audit import AuditResult, RuleViolation, PenaltiesBreakdown
from app.schemas.remediation import RemediationOption
from app.engine.scoring import audit_prescription
from app.engine.rule_registry import evaluate_all_rules
from app.agents.tools import search_amr_guidelines, get_pathogen_resistance_data, get_drug_monograph

logger = logging.getLogger("amr_guard.rag_audit")


# [PATTERN: Facade / Template Method] — RAG-First Clinical Prescription Audit
def audit_prescription_rag_first(
    patient: PatientContext,
    prescription_lines: List[PrescriptionLine],
    canonical_syndrome: Optional[str] = None,
    has_culture_report: bool = False,
    has_positive_microbiology: bool = False,
    is_outpatient: bool = True,
) -> AuditResult:
    """
    Execute Hybrid RAG-First clinical audit.
    If LLM API is available, searches guidelines via RAG and prompts LLM for clinical scoring.
    Automatically guards against hallucinations via Tier 1 deterministic safety rules.
    Gracefully falls back to deterministic rules if unconfigured or offline.
    """
    start_time = time.perf_counter()

    # 1. Graceful offline fallback if API key is not configured
    if not settings.OPENROUTER_API_KEY:
        logger.info("[RagAudit] OpenRouter API key not configured; falling back to deterministic core.")
        return audit_prescription(
            patient=patient,
            prescription_lines=prescription_lines,
            canonical_syndrome=canonical_syndrome,
            has_culture_report=has_culture_report,
            has_positive_microbiology=has_positive_microbiology,
            is_outpatient=is_outpatient,
        )

    try:
        # 2. Hybrid RAG Retrieval (BM25 + dense vector RRF)
        syndrome_text = canonical_syndrome or patient.diagnosis_text or "Unspecified Infection"
        guidelines_evidence = search_amr_guidelines(syndrome_text, limit=3)

        drug_summaries = []
        for line in prescription_lines:
            d_name = line.canonical_drug
            mono = get_drug_monograph(d_name)
            g_drug = search_amr_guidelines(d_name, limit=2)
            drug_summaries.append(f"Drug: {d_name} | Monograph: {mono}\nGuidelines:\n{g_drug}")

        resistance_context = ""
        if any(term in syndrome_text.lower() for term in ["uti", "urinary", "cystitis"]):
            resistance_context = get_pathogen_resistance_data("UTI")
        elif any(term in syndrome_text.lower() for term in ["cap", "pneumonia", "respiratory"]):
            resistance_context = get_pathogen_resistance_data("Respiratory")

        # 3. Build Clinical Scenario & Prompt
        scenario_description = (
            f"PATIENT CONTEXT:\n"
            f"- Age: {patient.age_years} years, Sex: {patient.sex}\n"
            f"- Pregnant: {patient.is_pregnant}\n"
            f"- Weight: {patient.weight_kg if patient.weight_kg is not None else 'Unrecorded'} kg\n"
            f"- eGFR: {patient.egfr if patient.egfr is not None else 'Unrecorded'} mL/min\n"
            f"- Documented Allergies: {patient.allergies or 'NKDA'}\n"
            f"- Medical History / Comorbidities: {patient.medical_history or 'None documented'}\n"
            f"- Suspected Diagnosis: {syndrome_text}\n"
            f"- Clinical Setting: {'Outpatient' if is_outpatient else 'Inpatient'}\n"
            f"- Culture Report Available: {has_culture_report}\n\n"
            f"PRESCRIBED MEDICATIONS:\n"
            + "\n".join(
                f"- {line.canonical_drug}: {line.strength or ''} {line.frequency or ''} for {line.duration_days or 5} days (Route: {line.route or 'Oral'})"
                for line in prescription_lines
            )
        )

        system_prompt = (
            "You are the AMR-Guard Clinical Prescription Audit Agent. Evaluate this outpatient antimicrobial "
            "prescription against authoritative ICMR Standard Treatment Guidelines (STG) 2022/2024 and WHO AWaRe Policy.\n\n"
            "CRITICAL EVALUATION CRITERIA:\n"
            "1. Tier 1 Contraindications (Zero Tolerance): Pediatric FQs/tetracyclines (<18 yrs), pregnancy Category D/X, "
            "geriatric/low eGFR (<30) nitrofurantoin, nephrotoxic agents without renal function, documented drug allergies (e.g. penicillin, sulfa), "
            "fatal comorbidity warnings (e.g. myasthenia gravis + FQ, G6PD + nitrofurantoin/sulfa). If violated -> status: 'BLOCKED', score: 100.0, band: 'RED'.\n"
            "2. Tier 2 Indication: Self-limiting viral URTI/bronchitis/diarrhea do not warrant antimicrobials (Indication penalty).\n"
            "3. Tier 3 AWaRe Spectrum: Outpatient empirical Watch-group drugs when Access alternatives exist (Class penalty: 45.0); "
            "Reserve drugs without positive microbiology (Class penalty: 85.0).\n"
            "4. Tier 4 Duration: Mild CAP > 5 days or cystitis > 5 days (Duration penalty).\n"
            "5. Tier 5 Resistance: Empirical Fluoroquinolones in UTI (>75% local E. coli resistance).\n"
            "6. FDA Indications & Boxed Warnings: Cross-reference prescribed antimicrobials against their FDA-approved usage and serious adverse reaction/boxed warning profiles in the drug monograph. Flag any agent contraindicated for the diagnosis (e.g. Daptomycin in pulmonary infections) or whose boxed warnings conflict with patient comorbidities (e.g. Ciprofloxacin in Myasthenia Gravis or arrhythmia).\n"
            "7. Therapeutic Duplication & Co-prescription Hazard: Prescribing multiple concurrent systemic NSAIDs (e.g. Diclofenac + Ibuprofen) is an irrational duplication with severe GI/renal toxicity risk. Assign Indication penalty: 50.0.\n\n"
            "SCORING CALIBRATION:\n"
            "AMR Risk Score is calculated mathematically as: min(100.0, 0.4 * p_class + 0.2 * p_duration + 0.4 * p_indication). Do NOT assign 100.0 unless a lethal Tier 1 contraindication is tripped.\n\n"
            "You MUST respond strictly in valid JSON matching this schema:\n"
            "{\n"
            '  "status": "APPROVED" | "FLAGGED" | "BLOCKED",\n'
            '  "score": <float 0.0 - 100.0>,\n'
            '  "band": "GREEN" | "AMBER" | "RED",\n'
            '  "penalties": {"p_class": <float>, "p_duration": <float>, "p_indication": <float>},\n'
            '  "flags": [\n'
            '    {\n'
            '      "tier": <int 1-5>,\n'
            '      "rule_id": "<STRING>",\n'
            '      "rule_name": "<STRING>",\n'
            '      "severity": "BLOCKED" | "HIGH" | "MEDIUM" | "LOW",\n'
            '      "drug": "<STRING>",\n'
            '      "penalty_type": "contraindication" | "indication" | "class" | "duration" | "resistance",\n'
            '      "penalty_score": <float>,\n'
            '      "rationale": "<CLINICAL_REASON>",\n'
            '      "remediation": "<RECOMMENDATION>",\n'
            '      "citation": "<ICMR/WHO_CITATION>"\n'
            '    }\n'
            '  ],\n'
            '  "remediation_options": [\n'
            '    {\n'
            '      "id": "<ID>",\n'
            '      "title": "<TITLE>",\n'
            '      "description": "<DESCRIPTION>",\n'
            '      "trade_off": "<TRADE_OFF>",\n'
            '      "first_line_drugs": ["<DRUG>"]\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        user_prompt = (
            f"{scenario_description}\n\n"
            f"RETRIEVED GUIDELINE EVIDENCE (Hybrid RAG RRF):\n{guidelines_evidence}\n\n"
            f"DRUG MONOGRAPHS & SPECIFIC GUIDELINES:\n" + "\n\n".join(drug_summaries) + "\n\n"
            + (f"SURVEILLANCE RESISTANCE DATA:\n{resistance_context}\n\n" if resistance_context else "")
            + "Provide your comprehensive clinical audit in the specified JSON format."
        )

        # 4. Invoke LLM via OpenRouter
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )

        response = client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
        )

        raw_json_str = response.choices[0].message.content or "{}"
        llm_data = json.loads(raw_json_str)

        # Parse into Pydantic models with resilient normalization
        flags = []
        for f in llm_data.get("flags", []):
            if isinstance(f, dict):
                try:
                    flags.append(RuleViolation.model_validate(f))
                except Exception as ex:
                    logger.debug("[RagAudit] Flag parsing issue: %s", ex)

        remediations = []
        for r in llm_data.get("remediation_options", []):
            if isinstance(r, dict):
                rec_type = r.get("recommendation_type") or r.get("type") or "SWITCH_DRUG"
                guidance = r.get("guidance") or r.get("description") or r.get("title") or "Clinical guidance"
                sugg_drug = r.get("suggested_drug") or (r.get("first_line_drugs")[0] if r.get("first_line_drugs") else None)
                sugg_dur = r.get("suggested_duration_days") or r.get("duration_days")
                cite = r.get("source_citation") or r.get("citation")
                remediations.append(
                    RemediationOption(
                        recommendation_type=rec_type,
                        suggested_drug=sugg_drug,
                        suggested_duration_days=sugg_dur,
                        guidance=guidance,
                        source_citation=cite,
                    )
                )

        penalties_dict = llm_data.get("penalties", {})

        penalties = PenaltiesBreakdown(
            p_class=float(penalties_dict.get("p_class", 0.0)),
            p_duration=float(penalties_dict.get("p_duration", 0.0)),
            p_indication=float(penalties_dict.get("p_indication", 0.0)),
        )

        score = float(llm_data.get("score", 0.0))
        status = str(llm_data.get("status", "APPROVED")).upper()
        band = str(llm_data.get("band", "GREEN")).upper()

        # 5. Deterministic Safety Net Verification & Mathematical Calibration
        safety_violations = evaluate_all_rules(
            patient=patient,
            prescription_lines=prescription_lines,
            canonical_syndrome=canonical_syndrome,
            has_culture_report=has_culture_report,
            has_positive_microbiology=has_positive_microbiology,
            is_outpatient=is_outpatient,
        )

        existing_rule_ids = {f.rule_id for f in flags}
        prepended_flags = []
        for sv in safety_violations:
            if sv.rule_id not in existing_rule_ids:
                prepended_flags.append(sv)
                existing_rule_ids.add(sv.rule_id)
        flags = prepended_flags + flags

        has_tier_1 = any(v.tier == 1 or v.severity == "BLOCKED" for v in flags)

        # Calculate mathematical penalty components
        class_penalties = [f.penalty_score for f in flags if f.penalty_type == "class"]
        dur_penalties = [f.penalty_score for f in flags if f.penalty_type == "duration"]
        ind_penalties = [f.penalty_score for f in flags if f.penalty_type == "indication"]

        p_class = min(100.0, sum(class_penalties)) if class_penalties else penalties.p_class
        p_duration = min(100.0, sum(dur_penalties)) if dur_penalties else penalties.p_duration
        p_indication = min(100.0, sum(ind_penalties)) if ind_penalties else penalties.p_indication

        penalties = PenaltiesBreakdown(
            p_class=p_class,
            p_duration=p_duration,
            p_indication=p_indication,
        )

        if has_tier_1:
            status = "BLOCKED"
            score = 100.0
            band = "RED"
        else:
            raw_math_score = (0.4 * p_class) + (0.2 * p_duration) + (0.4 * p_indication)
            calc_score = round(min(100.0, raw_math_score), 1)
            score = calc_score

            if len(flags) > 0 or score > 0.0:
                status = "FLAGGED"
                if score >= 75.0:
                    band = "RED"
                elif score >= 35.0:
                    band = "AMBER"
                else:
                    band = "GREEN"
            else:
                status = "APPROVED"
                band = "GREEN"

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)


        return AuditResult(
            status=status,
            score=score,
            band=band,
            penalties=penalties,
            flags=flags,
            remediation_options=remediations,
            latency_ms=elapsed_ms,
        )

    except Exception as exc:
        logger.warning(
            "[RagAudit] LLM RAG audit encountered exception: %s. Falling back to deterministic core.",
            exc,
            exc_info=True,
        )
        # Graceful fallback to deterministic engine
        return audit_prescription(
            patient=patient,
            prescription_lines=prescription_lines,
            canonical_syndrome=canonical_syndrome,
            has_culture_report=has_culture_report,
            has_positive_microbiology=has_positive_microbiology,
            is_outpatient=is_outpatient,
        )
