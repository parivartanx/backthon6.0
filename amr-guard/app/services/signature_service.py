"""
Deterministic Input Signature Service for Clinical Prescription Audits.
Generates canonical SHA-256 signatures for exact-match audit memoization.
"""
import hashlib
import json
import re
from typing import Any, Dict, List, Optional, Union

from app.schemas.audit import PrescriptionAuditRequest
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine, MedicineEntry, PatientCaseContext


# [PATTERN: Value Object] — Canonical normalized representation for deterministic hashing
# [SOLID: SRP] — Dedicated service for canonicalization and signature generation
# [DRY] — Centralized string, patient, and prescription line normalization


def normalize_string(val: Optional[str]) -> str:
    """Lowercase, strip, and collapse consecutive whitespace."""
    if not val:
        return ""
    cleaned = re.sub(r"\s+", " ", str(val).strip().lower())
    return cleaned


def canonicalize_patient(
    patient: Optional[Union[PatientContext, PatientCaseContext, Dict[str, Any]]]
) -> Dict[str, Any]:
    """Convert patient context to canonical dictionary."""
    if not patient:
        return {}

    if isinstance(patient, dict):
        p_dict = patient
    elif hasattr(patient, "model_dump"):
        p_dict = patient.model_dump()
    else:
        p_dict = vars(patient)

    age_val = p_dict.get("age_years")
    if age_val is None:
        raw_age = p_dict.get("age")
        if raw_age is not None and str(raw_age).isdigit():
            age_val = int(raw_age)
        else:
            age_val = 0

    sex_raw = normalize_string(p_dict.get("sex"))
    if sex_raw in ["m", "male"]:
        sex = "m"
    elif sex_raw in ["f", "female"]:
        sex = "f"
    else:
        sex = "other"

    is_preg = bool(p_dict.get("is_pregnant")) or (
        normalize_string(p_dict.get("pregnancyStatus")) == "pregnant"
    )

    weight = p_dict.get("weight_kg")
    try:
        weight_val = round(float(weight), 1) if weight is not None else None
    except (ValueError, TypeError):
        weight_val = None

    egfr = p_dict.get("egfr")
    try:
        egfr_val = round(float(egfr), 1) if egfr is not None else None
    except (ValueError, TypeError):
        egfr_val = None

    allergies_raw = normalize_string(p_dict.get("allergies"))
    allergies = (
        "nkda"
        if not allergies_raw or allergies_raw in ["none", "nil", "nkda", "no known allergies"]
        else allergies_raw
    )

    med_hist = normalize_string(
        p_dict.get("medical_history") or p_dict.get("medicalHistory")
    )
    diag = normalize_string(
        p_dict.get("diagnosis_text")
        or p_dict.get("suspectedDiagnosis")
        or p_dict.get("symptoms")
    )

    return {
        "age_years": int(age_val),
        "sex": sex,
        "is_pregnant": is_preg,
        "weight_kg": weight_val,
        "egfr": egfr_val,
        "allergies": allergies,
        "medical_history": med_hist,
        "diagnosis_text": diag,
    }


def canonicalize_prescription_line(
    line: Union[PrescriptionLine, MedicineEntry, Dict[str, Any]]
) -> Dict[str, Any]:
    """Convert prescription line to canonical medication dictionary."""
    if isinstance(line, dict):
        m = line
    elif hasattr(line, "model_dump"):
        m = line.model_dump()
    else:
        m = vars(line)

    drug_name = normalize_string(
        m.get("generic")
        or m.get("genericName")
        or m.get("drug_name")
        or m.get("brand")
        or m.get("brandName")
        or m.get("raw_text")
    )
    # Standardize spacing in strength (e.g., '500 mg' -> '500mg')
    strength_raw = normalize_string(m.get("strength"))
    strength = re.sub(r"(\d+)\s+(mg|g|mcg|ml)", r"\1\2", strength_raw)

    freq = normalize_string(m.get("frequency"))
    route = normalize_string(m.get("route")) or "oral"

    dur = m.get("duration_days")
    if dur is None:
        raw_dur = m.get("duration")
        if raw_dur:
            match = re.search(r"(\d+)", str(raw_dur))
            dur = int(match.group(1)) if match else 5
        else:
            dur = 5

    return {
        "drug_name": drug_name,
        "strength": strength,
        "route": route,
        "frequency": freq,
        "duration_days": int(dur),
        "is_fdc": bool(m.get("is_fdc", False)),
        "is_nephrotoxic": bool(m.get("is_nephrotoxic", False)),
        "outpatient_iv_restricted": bool(m.get("outpatient_iv_restricted", False)),
    }


def canonicalize_audit_input(
    request: Optional[PrescriptionAuditRequest] = None,
    patient: Optional[Union[PatientContext, PatientCaseContext, Dict[str, Any]]] = None,
    prescription_lines: Optional[List[Any]] = None,
    canonical_syndrome: Optional[str] = None,
    has_culture_report: bool = False,
    has_positive_microbiology: bool = False,
    is_outpatient: bool = True,
    scenario: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Produce a deterministic, canonically ordered dictionary of exact input details.
    """
    if request is not None:
        p_obj = request.patient
        lines_obj = request.prescription_lines
        syndrome_val = request.canonical_syndrome
        culture_val = request.has_culture_report
        micro_val = request.has_positive_microbiology
        outpatient_val = request.is_outpatient
        scenario_val = request.scenario
    else:
        p_obj = patient
        lines_obj = prescription_lines or []
        syndrome_val = canonical_syndrome
        culture_val = has_culture_report
        micro_val = has_positive_microbiology
        outpatient_val = is_outpatient
        scenario_val = scenario

    norm_scenario = normalize_string(scenario_val)
    canon_patient = canonicalize_patient(p_obj)
    canon_lines = [canonicalize_prescription_line(line) for line in (lines_obj or [])]

    # Deterministic sorting of lines so medicine order permutation produces identical signature
    canon_lines.sort(
        key=lambda x: (
            x["drug_name"],
            x["strength"],
            x["duration_days"],
            x["frequency"],
            x["route"],
        )
    )

    return {
        "version": 1,
        "scenario": norm_scenario,
        "patient": canon_patient,
        "prescription_lines": canon_lines,
        "canonical_syndrome": normalize_string(syndrome_val),
        "has_culture_report": bool(culture_val),
        "has_positive_microbiology": bool(micro_val),
        "is_outpatient": bool(outpatient_val),
    }


def compute_audit_signature(
    request: Optional[PrescriptionAuditRequest] = None,
    **kwargs: Any,
) -> str:
    """
    Compute a 64-character SHA-256 signature for the exact input details.
    Guarantees deterministic, collision-resistant signature across permutations.
    """
    canonical_dict = canonicalize_audit_input(request, **kwargs)
    canonical_bytes = json.dumps(
        canonical_dict, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return hashlib.sha256(canonical_bytes).hexdigest()
