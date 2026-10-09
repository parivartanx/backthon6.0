"""
Deterministic Five-Tier Verification Rules for AMR-Guard.
Derived directly from ICMR Standard Treatment Guidelines (STG) and WHO AWaRe Framework.
Pure Python - zero LLM dependencies.
"""
from typing import List, Optional
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.audit import RuleViolation
from app.engine.constraints import (
    normalize_text,
    is_fluoroquinolone,
    is_tetracycline,
    is_aminoglycoside,
    is_irrational_fdc,
    is_antibiotic_drug,
    get_aware_tier,
    PEDIATRIC_FLUOROQUINOLONES,
    PEDIATRIC_TETRACYCLINES,
    PREGNANCY_CONTRAINDICATED_DRUGS,
    VIRAL_SELF_LIMITING_SYNDROMES,
    SYNDROMES_WITH_ACCESS_FIRST_LINE,
)


# ---------------------------------------------------------------------------
# Tier 1: Hard Contraindication Rules (Zero Tolerance -> BLOCKED)
# ---------------------------------------------------------------------------

def check_pediatric_contraindications(
    patient: PatientContext,
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 1.1: Pediatric Fluoroquinolone / Tetracycline Ban.
    If patient_age < 18, flag and block any FQ or Tetracycline.
    """
    if patient.age_years >= 18:
        return None

    drug_name = line.canonical_drug
    norm_drug = normalize_text(drug_name)

    is_fq = is_fluoroquinolone(norm_drug)
    is_tc = is_tetracycline(norm_drug)

    if is_fq or is_tc:
        drug_class = "Fluoroquinolone" if is_fq else "Tetracycline"
        return RuleViolation(
            tier=1,
            rule_id="TIER1_PEDIATRIC_CONTRAINDICATION",
            rule_name=f"Pediatric {drug_class} Contraindication",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient age {patient.age_years} < 18 years. {drug_class}s carry high risk "
                "of irreversible musculoskeletal/cartilage damage and permanent pediatric dental enamel discoloration."
            ),
            remediation=(
                f"Immediately discontinue {drug_name}. Switch to age-appropriate safe pediatric "
                "first-line antimicrobials (e.g. Amoxicillin, Cefalexin, or Azithromycin if indicated)."
            ),
            citation="ICMR Pediatric Standard Treatment Guidelines & FDA Black Box Warning"
        )

    return None


def check_pregnancy_contraindications(
    patient: PatientContext,
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 1.2: Pregnancy Safety Gate.
    If is_pregnant == True, block FDA Category D/X or unapproved antimicrobials:
    [Doxycycline, Ciprofloxacin, Levofloxacin, Aminoglycosides, Clarithromycin].
    """
    if not patient.is_pregnant:
        return None

    drug_name = line.canonical_drug
    norm_drug = normalize_text(drug_name)

    is_contraindicated = False
    for bad_drug in PREGNANCY_CONTRAINDICATED_DRUGS:
        if bad_drug in norm_drug:
            is_contraindicated = True
            break

    if not is_contraindicated:
        if is_fluoroquinolone(norm_drug) or is_tetracycline(norm_drug) or is_aminoglycoside(norm_drug):
            is_contraindicated = True

    if is_contraindicated:
        return RuleViolation(
            tier=1,
            rule_id="TIER1_PREGNANCY_GATE",
            rule_name="Pregnancy Antimicrobial Contraindication",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient is pregnant. {drug_name} is FDA Category D/X or teratogenic, "
                "posing severe risks of fetal chondrotoxicity, permanent ototoxicity, and fetal harm."
            ),
            remediation=(
                f"Immediately discontinue {drug_name}. Substitute with pregnancy-safe alternatives "
                "(e.g., Amoxicillin, Ampicillin, Cefalexin, or Cefixime - FDA Category B)."
            ),
            citation="FDA Pregnancy Category D/X Guidance & WHO Clinical Safety Standards"
        )

    return None


def check_nitrofurantoin_renal_age(
    patient: PatientContext,
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 1.3: Renal Clearance / Age Restriction for Nitrofurantoin.
    If drug == 'Nitrofurantoin' and patient_age >= 65 (or documented low eGFR < 30 mL/min).
    """
    drug_name = line.canonical_drug
    norm_drug = normalize_text(drug_name)

    if "nitrofurantoin" in norm_drug:
        age_unsafe = patient.age_years >= 65
        egfr_unsafe = patient.egfr is not None and patient.egfr < 30.0

        if age_unsafe or egfr_unsafe:
            detail = f"Age {patient.age_years} >= 65" if age_unsafe else f"eGFR {patient.egfr} < 30 mL/min"
            return RuleViolation(
                tier=1,
                rule_id="TIER1_NITROFURANTOIN_RENAL_AGE",
                rule_name="Nitrofurantoin Geriatric / Low eGFR Restriction",
                severity="BLOCKED",
                drug=drug_name,
                penalty_type="contraindication",
                penalty_score=100.0,
                rationale=(
                    f"Prescribed Nitrofurantoin in unsafe patient cohort ({detail}). "
                    "Poor renal excretion leads to therapeutic failure and increased risk of peripheral neuropathy or pulmonary toxicity."
                ),
                remediation=(
                    "Discontinue Nitrofurantoin. In patients >= 65 or low eGFR, switch to single-dose "
                    "oral Fosfomycin or culture-guided beta-lactams."
                ),
                citation="Beers Criteria & ICMR Guidelines for Geriatric Antimicrobial Prescribing"
            )

    return None


def check_nephrotoxic_renal_safety(
    patient: PatientContext,
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 1.3: Mandatory Nephrotoxic Drug & Renal Function Safety Gate.
    Blocks high-risk narrow-therapeutic-index nephrotoxic antimicrobials (Vancomycin,
    Teicoplanin, Aminoglycosides, Colistin, Amphotericin B) if:
    1. Baseline eGFR is missing in elderly patients (age >= 65) or for drugs requiring baseline renal tracking.
    2. Documented eGFR < 30 mL/min without adjusted renal dosing protocol.
    """
    drug_name = line.canonical_drug
    norm_drug = normalize_text(drug_name)

    is_nephrotoxic = getattr(line, "is_nephrotoxic", False) or getattr(line, "requires_egfr", False)
    if not is_nephrotoxic:
        if any(d in norm_drug for d in ["vancomycin", "teicoplanin", "amikacin", "gentamicin", "tobramycin", "colistin", "polymyxin b"]):
            is_nephrotoxic = True

    if is_nephrotoxic:
        # Check missing eGFR (mandatory for elderly or high-risk NTI drugs)
        if patient.egfr is None:
            if patient.age_years >= 65 or getattr(line, "requires_egfr", False) or any(d in norm_drug for d in ["vancomycin", "teicoplanin", "colistin"]):
                return RuleViolation(
                    tier=1,
                    rule_id="TIER1_NEPHROTOXIC_MISSING_EGFR",
                    rule_name="Mandatory Baseline Renal Function Hold",
                    severity="BLOCKED",
                    drug=drug_name,
                    penalty_type="contraindication",
                    penalty_score=100.0,
                    rationale=(
                        f"Administering nephrotoxic agent '{drug_name}' to patient (Age {patient.age_years}) "
                        "without baseline Glomerular Filtration Rate (eGFR) or Serum Creatinine creates acute risk of kidney injury, accumulation toxicity, and ototoxicity."
                    ),
                    remediation=(
                        f"Place prescription on safety hold. Order an urgent Serum Creatinine / eGFR panel and establish Therapeutic Drug Monitoring (TDM) before initiating {drug_name}."
                    ),
                    citation="KDIGO Acute Kidney Injury Guidelines & FDA Black Box / TDM Safety Guidance"
                )

        # Check documented severe renal impairment
        if patient.egfr is not None and patient.egfr < 30.0:
            return RuleViolation(
                tier=1,
                rule_id="TIER1_NEPHROTOXIC_RENAL_IMPAIRMENT",
                rule_name="Severe Renal Impairment Contraindication",
                severity="BLOCKED",
                drug=drug_name,
                penalty_type="contraindication",
                penalty_score=100.0,
                rationale=(
                    f"Patient eGFR is {patient.egfr} mL/min (< 30 mL/min). Administering full-dose '{drug_name}' "
                    "carries severe risk of acute tubular necrosis, irreversible nephrotoxic failure, and ototoxicity."
                ),
                remediation=(
                    f"Dose adjustment or alternative non-nephrotoxic agent required. Consult clinical pharmacokinetics for renal dose recalculation."
                ),
                citation="KDIGO Guidelines & Clinical Pharmacokinetics Prescribing Standards"
            )

    return None


# ---------------------------------------------------------------------------
# Tier 2: Indication & Diagnosis Legitimacy Rules
# ---------------------------------------------------------------------------

def check_viral_self_limiting_indication(
    canonical_syndrome: Optional[str],
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 2.1: The Viral / Self-Limiting Infection Gate.
    If canonical_syndrome in [Acute Bronchitis, Common Cold, Viral URTI,
    Pharyngitis without Strep criteria, Acute Watery Diarrhea], then antibiotic_indicated == False.
    Indication Penalty P_indication = 100.
    """
    if not canonical_syndrome:
        return None

    norm_syn = normalize_text(canonical_syndrome)
    is_viral_syndrome = any(viral in norm_syn for viral in VIRAL_SELF_LIMITING_SYNDROMES)

    if is_viral_syndrome:
        drug_name = line.canonical_drug
        if not is_antibiotic_drug(drug_name):
            return None

        remediation_text = (

            "Mandate symptomatic supportive therapy only: ORS + Zinc for acute watery diarrhea; "
            "Paracetamol, hydration, and steam inhalation for viral URTI/bronchitis. Discontinue antibiotic."
        )
        return RuleViolation(
            tier=2,
            rule_id="TIER2_VIRAL_INDICATION_GATE",
            rule_name="Self-Limiting Viral Infection Non-Indication",
            severity="HIGH",
            drug=drug_name,
            penalty_type="indication",
            penalty_score=100.0,
            rationale=(
                f"Diagnosis '{canonical_syndrome}' has viral / self-limiting etiology. "
                "Antibiotics are medically not indicated and accelerate resistance without clinical benefit."
            ),
            remediation=remediation_text,
            citation="ICMR Standard Treatment Guidelines for Common Outpatient Infections"
        )

    return None


def check_unapproved_fdc(line: PrescriptionLine) -> Optional[RuleViolation]:
    """
    Tier 2.2: Unapproved Fixed-Dose Combination (FDC) Rule.
    If drug belongs to dual-antibiotic or irrational FDCs (e.g., Ofloxacin + Ornidazole).
    """
    drug_name = line.canonical_drug
    if is_irrational_fdc(drug_name) or line.is_fdc is True:
        # Check specifically if it matches known irrational combinations
        norm = normalize_text(drug_name)
        if any(fdc in norm for fdc in ["ofloxacin", "cefixime", "ciprofloxacin", "norfloxacin"]) and any(
            sec in norm for sec in ["ornidazole", "azithromycin", "tinidazole", "metronidazole"]
        ):
            return RuleViolation(
                tier=2,
                rule_id="TIER2_UNAPPROVED_FDC",
                rule_name="Unapproved Irrational FDC Prescribed",
                severity="HIGH",
                drug=drug_name,
                penalty_type="fdc",
                penalty_score=30.0,
                rationale=(
                    f"Drug '{drug_name}' is an irrational fixed-dose combination (dual-antibiotic/antiprotozoal). "
                    "Tagged as 'Not Recommended' under national regulatory guidelines."
                ),
                remediation=(
                    "Discontinue fixed-dose combination. Prescribe rational, targeted single-agent "
                    "antimicrobial therapy only if bacterial etiology is confirmed."
                ),
                citation="CDSCO Banned FDCs Gazette & ICMR Antimicrobial Stewardship"
            )

    return None


# ---------------------------------------------------------------------------
# Tier 3: WHO AWaRe Spectrum & Tier Escalation Rules
# ---------------------------------------------------------------------------

def check_watch_escalation(
    canonical_syndrome: Optional[str],
    line: PrescriptionLine,
    has_culture_report: bool
) -> Optional[RuleViolation]:
    """
    Tier 3.1: Watch-Group Over-Escalation Check.
    If drug.aware_tier == 'Watch' AND has_culture_report == False AND canonical_syndrome
    has an established 'Access' first-line alternative:
    Assign Class Penalty P_class = 45.
    """
    drug_name = line.canonical_drug
    aware_tier = get_aware_tier(drug_name, line.aware_tier)

    if aware_tier == "Watch" and not has_culture_report and canonical_syndrome:
        norm_syn = normalize_text(canonical_syndrome)
        # Find matching established Access alternative
        access_alt = None
        for syn_key, alt_text in SYNDROMES_WITH_ACCESS_FIRST_LINE.items():
            if syn_key in norm_syn or norm_syn in syn_key:
                access_alt = alt_text
                break

        if access_alt:
            return RuleViolation(
                tier=3,
                rule_id="TIER3_AWARE_WATCH_ESCALATION",
                rule_name="Empirical Watch-Group Over-Escalation",
                severity="MEDIUM",
                drug=drug_name,
                penalty_type="class",
                penalty_score=45.0,
                rationale=(
                    f"'{drug_name}' belongs to WHO 'Watch' group and was prescribed empirically "
                    f"without culture report for '{canonical_syndrome}' when a first-line 'Access' agent exists."
                ),
                remediation=f"De-escalate to standard Access first-line regimen: {access_alt}.",
                citation="WHO AWaRe Classification 2023 & ICMR Antimicrobial Stewardship Guidelines"
            )

    return None


def check_reserve_airgap(
    line: PrescriptionLine,
    is_outpatient: bool,
    has_positive_microbiology: bool
) -> Optional[RuleViolation]:
    """
    Tier 3.2: Reserve-Group 'Air-Gap' Gate.
    If drug.aware_tier == 'Reserve' in an outpatient consultation without
    positive microbiology/culture ID:
    Immediate administrative alert, Class Penalty P_class = 85.
    """
    drug_name = line.canonical_drug
    aware_tier = get_aware_tier(drug_name, line.aware_tier)

    if aware_tier == "Reserve" and is_outpatient and not has_positive_microbiology:
        return RuleViolation(
            tier=3,
            rule_id="TIER3_AWARE_RESERVE_AIRGAP",
            rule_name="Outpatient Reserve Group Air-Gap Violation",
            severity="HIGH",
            drug=drug_name,
            penalty_type="class",
            penalty_score=85.0,
            rationale=(
                f"'{drug_name}' is a WHO 'Reserve' last-resort antimicrobial prescribed in an "
                "outpatient consultation without confirmed positive microbiology identification."
            ),
            remediation=(
                "Administrative quarantine: Immediate Infectious Disease / Clinical Microbiologist "
                "sign-off required before dispensing. Empirical outpatient dispensing blocked."
            ),
            citation="WHO Reserve Group Stewardship Protocols & National Policy for Containment of AMR"
        )

    return None


# ---------------------------------------------------------------------------
# Tier 4: Therapeutic Course & Duration Limits
# ---------------------------------------------------------------------------

def check_cap_duration(
    canonical_syndrome: Optional[str],
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 4.1: Community-Acquired Pneumonia (CAP) Duration Cap.
    If canonical_syndrome == 'SYN_CAP_MILD' and duration_days > 5:
    P_duration = (duration_days - 5) * 15. Shorten to 5 days.
    """
    if not canonical_syndrome or not line.duration_days:
        return None

    norm_syn = normalize_text(canonical_syndrome)
    if "syn_cap_mild" in norm_syn or "cap mild" in norm_syn or "pneumonia" in norm_syn:
        if line.duration_days > 5:
            delta_days = line.duration_days - 5
            penalty = delta_days * 15.0
            return RuleViolation(
                tier=4,
                rule_id="TIER4_CAP_DURATION_CAP",
                rule_name="CAP Mild Course Duration Cap Exceeded",
                severity="MEDIUM",
                drug=line.canonical_drug,
                penalty_type="duration",
                penalty_score=penalty,
                rationale=(
                    f"Prescribed duration of {line.duration_days} days exceeds ICMR 5-day duration cap "
                    f"for mild Community-Acquired Pneumonia (excess: {delta_days} days)."
                ),
                remediation=(
                    "Shorten duration to 5 days (as per ICMR protocol, assuming patient is afebrile for >= 48 hours)."
                ),
                citation="ICMR Standard Treatment Guidelines: Community-Acquired Pneumonia"
            )

    return None


def check_uti_duration(
    canonical_syndrome: Optional[str],
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 4.2: Uncomplicated Lower UTI (Cystitis) Duration Cap.
    - If drug == 'Nitrofurantoin' and duration_days > 5: cap at 5 days, P_duration = (duration_days - 5) * 15.
    - If drug == 'Fosfomycin' and duration_days > 1: single sachet only, P_duration = (duration_days - 1) * 15.
    """
    if not canonical_syndrome or not line.duration_days:
        return None

    norm_syn = normalize_text(canonical_syndrome)
    if "uti" in norm_syn or "cystitis" in norm_syn:
        drug_name = line.canonical_drug
        norm_drug = normalize_text(drug_name)

        if "nitrofurantoin" in norm_drug and line.duration_days > 5:
            delta_days = line.duration_days - 5
            penalty = delta_days * 15.0
            return RuleViolation(
                tier=4,
                rule_id="TIER4_UTI_NITROFURANTOIN_DURATION_CAP",
                rule_name="UTI Nitrofurantoin Duration Cap Exceeded",
                severity="MEDIUM",
                drug=drug_name,
                penalty_type="duration",
                penalty_score=penalty,
                rationale=(
                    f"Nitrofurantoin course of {line.duration_days} days exceeds standard 5-day regimen for cystitis."
                ),
                remediation="Cap Nitrofurantoin duration at 5 days (100 mg BD).",
                citation="ICMR Guidelines: Treatment of Urinary Tract Infections"
            )

        if "fosfomycin" in norm_drug and line.duration_days > 1:
            delta_days = line.duration_days - 1
            penalty = delta_days * 15.0
            return RuleViolation(
                tier=4,
                rule_id="TIER4_UTI_FOSFOMYCIN_DURATION_CAP",
                rule_name="UTI Fosfomycin Single-Dose Violation",
                severity="MEDIUM",
                drug=drug_name,
                penalty_type="duration",
                penalty_score=penalty,
                rationale=(
                    f"Fosfomycin prescribed for {line.duration_days} days. Oral Fosfomycin for uncomplicated "
                    "cystitis is strictly a single-dose (1-day) 3g sachet."
                ),
                remediation="Enforce single-dose (1 sachet / 1 day) oral Fosfomycin only.",
                citation="ICMR STG & IDSA Uncomplicated Cystitis Protocol"
            )

    return None


# ---------------------------------------------------------------------------
# Tier 5: Local Pathogen Resistance Benchmarking (ICMR-AMRSN)
# ---------------------------------------------------------------------------

def check_uti_fluoroquinolone_resistance(
    canonical_syndrome: Optional[str],
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 5.1: Fluoroquinolone Resistance Penalty in UTIs.
    If canonical_syndrome == 'SYN_UNCOMPLICATED_UTI' and drug is a fluoroquinolone (Ciprofloxacin, Norfloxacin, etc.):
    Flag high failure probability (>75% resistance in uropathogenic E. coli isolates).
    """
    if not canonical_syndrome:
        return None

    norm_syn = normalize_text(canonical_syndrome)
    if "uti" in norm_syn or "cystitis" in norm_syn:
        drug_name = line.canonical_drug
        if is_fluoroquinolone(drug_name):
            return RuleViolation(
                tier=5,
                rule_id="TIER5_UTI_FQ_RESISTANCE_TRAP",
                rule_name="Empirical Fluoroquinolone Resistance Risk in UTI",
                severity="HIGH",
                drug=drug_name,
                penalty_type="resistance",
                penalty_score=20.0,
                rationale=(
                    f"Prescribed empirical fluoroquinolone ({drug_name}) for uncomplicated UTI. "
                    "ICMR-AMRSN surveillance confirms >75% resistance in uropathogenic E. coli isolates across Indian centers."
                ),
                remediation=(
                    "Switch empirical therapy to Nitrofurantoin (100mg BD for 5 days) or oral Fosfomycin (3g single sachet), "
                    "which retain >85% susceptibility against Indian uropathogens."
                ),
                citation="ICMR-AMRSN Annual Surveillance Report: Uropathogen Resistance Data"
            )

    return None
