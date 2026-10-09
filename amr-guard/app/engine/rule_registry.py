"""
Rule Registry for AMR-Guard Deterministic Core.
Orchestrates execution of all Five-Tier verification rules across prescription items.
"""
from typing import List, Optional
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.audit import RuleViolation
from app.engine.rules import (
    check_pediatric_contraindications,
    check_pregnancy_contraindications,
    check_nitrofurantoin_renal_age,
    check_nephrotoxic_renal_safety,
    check_viral_self_limiting_indication,
    check_unapproved_fdc,
    check_unmapped_syndrome_advisory,
    check_watch_escalation,
    check_reserve_airgap,
    check_outpatient_iv_safeguard,
    check_cap_duration,
    check_uti_duration,
    check_uti_fluoroquinolone_resistance,
)

RULE_METADATA = [
    {
        "id": "TIER1_PEDIATRIC_CONTRAINDICATION",
        "tier": 1,
        "name": "Pediatric Fluoroquinolone / Tetracycline Ban",
        "description": "Zero-tolerance gate blocking FQs and tetracyclines in patients < 18 years.",
        "citation": "ICMR Pediatric Guidelines & FDA Warnings"
    },
    {
        "id": "TIER1_PREGNANCY_GATE",
        "tier": 1,
        "name": "Pregnancy Safety Gate",
        "description": "Zero-tolerance gate blocking FDA Category D/X drugs during pregnancy.",
        "citation": "FDA Pregnancy Guidance & WHO"
    },
    {
        "id": "TIER1_NITROFURANTOIN_RENAL_AGE",
        "tier": 1,
        "name": "Nitrofurantoin Geriatric / Renal Gate",
        "description": "Blocks Nitrofurantoin in age >= 65 or low eGFR < 30 mL/min.",
        "citation": "Beers Criteria & ICMR Geriatric Guidelines"
    },
    {
        "id": "TIER1_NEPHROTOXIC_MISSING_EGFR",
        "tier": 1,
        "name": "Mandatory Baseline Renal Function Hold",
        "description": "Blocks narrow-therapeutic-index nephrotoxic drugs when eGFR is missing in elderly or for high-risk antimicrobials.",
        "citation": "KDIGO Guidelines & FDA Black Box / TDM Standards"
    },
    {
        "id": "TIER1_NEPHROTOXIC_RENAL_IMPAIRMENT",
        "tier": 1,
        "name": "Severe Renal Impairment Contraindication",
        "description": "Blocks full-dose nephrotoxic agents when eGFR < 30 mL/min.",
        "citation": "KDIGO AKI Guidelines & Clinical Pharmacokinetics"
    },
    {
        "id": "TIER2_VIRAL_INDICATION_GATE",
        "tier": 2,
        "name": "Viral / Self-Limiting Infection Gate",
        "description": "Flags antimicrobial prescription for viral or self-limiting conditions (P_indication = 100).",
        "citation": "ICMR STG Common Infections"
    },
    {
        "id": "TIER2_UNAPPROVED_FDC",
        "tier": 2,
        "name": "Unapproved Irrational FDC Gate",
        "description": "Flags irrational dual-antimicrobial fixed dose combinations.",
        "citation": "CDSCO Banned FDCs Gazette"
    },
    {
        "id": "TIER2_UNMAPPED_SYNDROME_ADVISORY",
        "tier": 2,
        "name": "Unconfirmed Indication / Vague Symptom Advisory",
        "description": "Advisory flag when Watch/Reserve antimicrobials are prescribed for non-canonical symptoms without culture (P_indication = 30).",
        "citation": "ICMR Standard Treatment Guidelines 2022 & WHO AWaRe Policy"
    },
    {
        "id": "TIER3_AWARE_WATCH_ESCALATION",
        "tier": 3,
        "name": "Watch-Group Over-Escalation Check",
        "description": "Flags empirical Watch-group drugs when Access alternatives exist (P_class = 45).",
        "citation": "WHO AWaRe Classification 2023"
    },
    {
        "id": "TIER3_AWARE_RESERVE_AIRGAP",
        "tier": 3,
        "name": "Reserve-Group Air-Gap Gate",
        "description": "Blocks outpatient empirical Reserve group prescribing without microbiology (P_class = 85).",
        "citation": "WHO Reserve Stewardship Protocols"
    },
    {
        "id": "TIER3_OUTPATIENT_IV_SAFEGUARD",
        "tier": 3,
        "name": "Outpatient Parenteral Antimicrobial Safeguard",
        "description": "Flags high-potency intravenous antimicrobials prescribed in outpatient settings without OPAT or culture (P_class = 60).",
        "citation": "IDSA OPAT Guidelines & ICMR Stewardship Standards"
    },
    {
        "id": "TIER4_CAP_DURATION_CAP",
        "tier": 4,
        "name": "CAP Mild Duration Cap",
        "description": "Caps mild CAP courses at 5 days (P_duration = delta * 15).",
        "citation": "ICMR STG Pneumonia"
    },
    {
        "id": "TIER4_UTI_NITROFURANTOIN_DURATION_CAP",
        "tier": 4,
        "name": "UTI Nitrofurantoin Duration Cap",
        "description": "Caps uncomplicated cystitis Nitrofurantoin at 5 days.",
        "citation": "ICMR STG Urinary Tract Infections"
    },
    {
        "id": "TIER4_UTI_FOSFOMYCIN_DURATION_CAP",
        "tier": 4,
        "name": "UTI Fosfomycin Single-Dose Cap",
        "description": "Enforces 1-day single sachet regimen for oral Fosfomycin.",
        "citation": "ICMR & IDSA Guidelines"
    },
    {
        "id": "TIER5_UTI_FQ_RESISTANCE_TRAP",
        "tier": 5,
        "name": "Fluoroquinolone Resistance Penalty in UTIs",
        "description": "Flags empirical FQ in UTI due to >75% local E. coli resistance.",
        "citation": "ICMR-AMRSN Surveillance Network"
    },
]


def evaluate_all_rules(
    patient: PatientContext,
    prescription_lines: List[PrescriptionLine],
    canonical_syndrome: Optional[str] = None,
    has_culture_report: bool = False,
    has_positive_microbiology: bool = False,
    is_outpatient: bool = True,
) -> List[RuleViolation]:
    """
    Execute the entire Five-Tier Verification Pipeline across all prescription lines.
    Purely deterministic evaluation.
    """
    violations: List[RuleViolation] = []

    # If canonical_syndrome is not explicitly provided, attempt fallback from patient diagnosis_text
    active_syndrome = canonical_syndrome or patient.diagnosis_text

    for line in prescription_lines:
        # Tier 1: Patient Safety & Hard Contraindications
        v_ped = check_pediatric_contraindications(patient, line)
        if v_ped:
            violations.append(v_ped)

        v_preg = check_pregnancy_contraindications(patient, line)
        if v_preg:
            violations.append(v_preg)

        v_renal = check_nitrofurantoin_renal_age(patient, line)
        if v_renal:
            violations.append(v_renal)

        v_nephro = check_nephrotoxic_renal_safety(patient, line)
        if v_nephro:
            violations.append(v_nephro)

        # Tier 2: Indication & Diagnosis Legitimacy
        v_viral = check_viral_self_limiting_indication(active_syndrome, line)
        if v_viral:
            violations.append(v_viral)

        v_fdc = check_unapproved_fdc(line)
        if v_fdc:
            violations.append(v_fdc)

        v_unmapped = check_unmapped_syndrome_advisory(active_syndrome, line, has_culture_report)
        if v_unmapped:
            violations.append(v_unmapped)

        # Tier 3: WHO AWaRe Spectrum
        v_watch = check_watch_escalation(active_syndrome, line, has_culture_report)
        if v_watch:
            violations.append(v_watch)

        v_reserve = check_reserve_airgap(line, is_outpatient, has_positive_microbiology)
        if v_reserve:
            violations.append(v_reserve)

        v_outpatient_iv = check_outpatient_iv_safeguard(line, is_outpatient, has_culture_report)
        if v_outpatient_iv:
            violations.append(v_outpatient_iv)

        # Tier 4: Therapeutic Course & Duration Limits
        v_cap_dur = check_cap_duration(active_syndrome, line)
        if v_cap_dur:
            violations.append(v_cap_dur)

        v_uti_dur = check_uti_duration(active_syndrome, line)
        if v_uti_dur:
            violations.append(v_uti_dur)

        # Tier 5: Local Pathogen Resistance Benchmarking
        v_uti_fq = check_uti_fluoroquinolone_resistance(active_syndrome, line)
        if v_uti_fq:
            violations.append(v_uti_fq)

    return violations
