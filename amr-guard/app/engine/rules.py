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
    is_penicillin_drug,
    is_cephalosporin_drug,
    is_carbapenem_drug,
    is_sulfa_drug,
    is_macrolide_drug,
    PEDIATRIC_DAILY_DOSE_CEILINGS_MG_KG,
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


# [PATTERN: Specification] — Tier 1 & Tier 2 Drug Allergy Safety Verification
def check_drug_allergy_contraindications(
    patient: PatientContext,
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 1 / Tier 2 Drug Allergy Safety Gate.
    Verifies documented patient allergies against prescribed antimicrobials:
    - Tier 1 Hard Stop (BLOCKED, 100.0): Direct drug match or core class match (e.g. Penicillin allergy + Amoxicillin, Sulfa allergy + Co-trimoxazole).
    - Tier 2 Alert (HIGH, 60.0): Beta-lactam cross-reactivity warning (Penicillin allergy + Cephalosporin / Carbapenem).
    """
    if not patient.allergies:
        return None

    norm_allergies = normalize_text(patient.allergies)
    if not norm_allergies:
        return None

    # Check for negative allergy declarations (e.g., NKDA, none, nil, no known drug allergies)
    negations = [
        "nkda", "none", "nil", "n/a", "na", "no allergies", "no allergy",
        "no known drug allergies", "no known allergies", "no known drug allergy"
    ]
    if norm_allergies in negations:
        return None
    if ("nkda" in norm_allergies or "no known" in norm_allergies) and not any(
        kw in norm_allergies for kw in ["except", "but", "penicillin", "sulfa", "amox", "cipro", "cefixime"]
    ):
        return None

    drug_name = line.canonical_drug
    norm_drug = normalize_text(drug_name)

    is_penicillin_allergic = any(
        kw in norm_allergies for kw in ["penicillin", "amoxicillin", "ampicillin", "augmentin", "amox", "cloxacillin"]
    )
    is_sulfa_allergic = any(
        kw in norm_allergies for kw in ["sulfa", "sulfonamide", "cotrimoxazole", "co-trimoxazole", "bactrim", "septra", "sulfamethoxazole"]
    )
    is_fq_allergic = any(
        kw in norm_allergies for kw in ["fluoroquinolone", "quinolone", "ciprofloxacin", "cipro", "levofloxacin", "levo", "ofloxacin", "moxifloxacin", "norfloxacin"]
    )
    is_macrolide_allergic = any(
        kw in norm_allergies for kw in ["macrolide", "azithromycin", "clarithromycin", "erythromycin", "roxithromycin"]
    )
    is_cephalosporin_allergic = any(
        kw in norm_allergies for kw in ["cephalosporin", "cefixime", "ceftriaxone", "cefuroxime", "cefpodoxime", "cefalexin", "cephalexin", "cefazolin"]
    )

    # 1. Tier 1 Direct Class Match: Penicillin
    if is_penicillin_allergic and is_penicillin_drug(norm_drug):
        return RuleViolation(
            tier=1,
            rule_id="TIER1_DRUG_ALLERGY_CONTRAINDICATION",
            rule_name="Documented Drug Allergy Hard Stop",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient has documented Penicillin allergy ('{patient.allergies}'). Prescribing {drug_name} "
                "poses life-threatening risk of acute type I IgE-mediated anaphylaxis, bronchospasm, and angioedema."
            ),
            remediation=(
                f"Immediately discontinue {drug_name}. Switch to a non-cross-reacting alternative antimicrobial class "
                "(e.g., Macrolide, Fluoroquinolone, or Doxycycline if clinically indicated)."
            ),
            citation="FDA Penicillin Monograph & British National Formulary (BNF) Allergy Guidelines"
        )

    # 2. Tier 1 Direct Class Match: Sulfa / Sulfonamide
    if is_sulfa_allergic and is_sulfa_drug(norm_drug):
        return RuleViolation(
            tier=1,
            rule_id="TIER1_DRUG_ALLERGY_CONTRAINDICATION",
            rule_name="Documented Drug Allergy Hard Stop",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient has documented Sulfa/Sulfonamide allergy ('{patient.allergies}'). Prescribing {drug_name} "
                "poses high risk of severe hypersensitivity, Stevens-Johnson Syndrome (SJS), and toxic epidermal necrolysis (TEN)."
            ),
            remediation=(
                f"Immediately discontinue {drug_name}. Substitute with non-sulfonamide antimicrobial according to susceptibility."
            ),
            citation="FDA Sulfonamide Monograph & ICMR Antimicrobial Guidelines"
        )

    # 3. Tier 1 Direct Class Match: Fluoroquinolone
    if is_fq_allergic and is_fluoroquinolone(norm_drug):
        return RuleViolation(
            tier=1,
            rule_id="TIER1_DRUG_ALLERGY_CONTRAINDICATION",
            rule_name="Documented Drug Allergy Hard Stop",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient has documented Fluoroquinolone allergy ('{patient.allergies}'). Prescribing {drug_name} "
                "is strictly contraindicated due to severe hypersensitivity risk."
            ),
            remediation=f"Immediately discontinue {drug_name}. Select an alternative non-quinolone agent.",
            citation="FDA Fluoroquinolone Monograph & Clinical Practice Guidelines"
        )

    # 4. Tier 1 Direct Class Match: Macrolide
    if is_macrolide_allergic and is_macrolide_drug(norm_drug):
        return RuleViolation(
            tier=1,
            rule_id="TIER1_DRUG_ALLERGY_CONTRAINDICATION",
            rule_name="Documented Drug Allergy Hard Stop",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient has documented Macrolide allergy ('{patient.allergies}'). Prescribing {drug_name} "
                "is strictly contraindicated due to acute macrolide hypersensitivity."
            ),
            remediation=f"Immediately discontinue {drug_name}. Select an alternative non-macrolide agent.",
            citation="FDA Macrolide Monograph & Clinical Safety Guidelines"
        )

    # 5. Tier 1 Direct Class Match: Cephalosporin
    if is_cephalosporin_allergic and is_cephalosporin_drug(norm_drug):
        return RuleViolation(
            tier=1,
            rule_id="TIER1_DRUG_ALLERGY_CONTRAINDICATION",
            rule_name="Documented Drug Allergy Hard Stop",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient has documented Cephalosporin allergy ('{patient.allergies}'). Prescribing {drug_name} "
                "poses acute risk of severe allergic reaction and anaphylaxis."
            ),
            remediation=f"Immediately discontinue {drug_name}. Select an alternative non-cephalosporin agent.",
            citation="FDA Cephalosporin Monograph & BNF Guidelines"
        )

    # 6. Tier 1 Exact Drug Name Match
    if norm_drug in norm_allergies and len(norm_drug) >= 4:
        return RuleViolation(
            tier=1,
            rule_id="TIER1_DRUG_ALLERGY_CONTRAINDICATION",
            rule_name="Documented Drug Allergy Hard Stop",
            severity="BLOCKED",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=100.0,
            rationale=(
                f"Patient has documented direct allergy to {drug_name} ('{patient.allergies}'). "
                f"Prescribing {drug_name} is strictly contraindicated."
            ),
            remediation=f"Immediately discontinue {drug_name}. Select an alternative antimicrobial class.",
            citation="FDA Monograph & Clinical Pharmacotherapy Safety Standards"
        )

    # 7. Tier 2 Beta-Lactam Cross-Reactivity Alert (Penicillin allergy -> Cephalosporin / Carbapenem)
    if is_penicillin_allergic and (is_cephalosporin_drug(norm_drug) or is_carbapenem_drug(norm_drug)):
        drug_class = "Cephalosporin" if is_cephalosporin_drug(norm_drug) else "Carbapenem"
        return RuleViolation(
            tier=2,
            rule_id="TIER2_ALLERGY_CROSS_REACTIVITY_WARNING",
            rule_name="Beta-Lactam Allergy Cross-Reactivity Warning",
            severity="HIGH",
            drug=drug_name,
            penalty_type="contraindication",
            penalty_score=60.0,
            rationale=(
                f"Patient has documented Penicillin allergy ('{patient.allergies}'). {drug_name} is a {drug_class} "
                "with shared beta-lactam core structure posing 1-2% cross-reactivity risk. Exercise high caution."
            ),
            remediation=(
                f"Assess severity of prior penicillin reaction. In cases of prior severe IgE-mediated anaphylaxis, "
                f"avoid all {drug_class}s. If reaction was a mild delayed maculopapular rash, {drug_name} may be administered with close clinical observation."
            ),
            citation="British National Formulary (BNF) & Joint Task Force on Practice Parameters (JTFPP) Beta-Lactam Allergy Guidance"
        )

    return None


# [PATTERN: Specification] — Tier 1 & Tier 2 Comorbidity Black-Box Warning Gate
def check_comorbidity_contraindications(
    patient: PatientContext,
    line: PrescriptionLine
) -> Optional[RuleViolation]:
    """
    Tier 1 / Tier 2 Comorbidity Black-Box Warning Gate.
    Verifies documented patient medical history / comorbidities against prescribed antimicrobials:
    - Tier 1 Hard Stop (BLOCKED, 100.0):
      * Myasthenia Gravis + Fluoroquinolones (Black Box: fatal neuromuscular respiratory depression)
      * Myasthenia Gravis + Aminoglycosides (neuromuscular blockade)
      * G6PD Deficiency + Nitrofurantoin or Sulfonamides (acute hemolytic anemia crisis)
    - Tier 2 Serious Warning (HIGH, 60.0):
      * Long QT Syndrome / Arrhythmia + Fluoroquinolones or Macrolides (Torsades de Pointes)
      * Epilepsy / Seizure Disorder + Carbapenems (lowers seizure threshold)
    """
    history_text = f"{patient.medical_history or ''} {patient.diagnosis_text or ''}".lower()
    if not history_text.strip():
        return None

    drug_name = line.canonical_drug
    norm_drug = normalize_text(drug_name)

    # 1. Myasthenia Gravis (Tier 1 Fatal Contraindication)
    is_myasthenia = "myasthenia" in history_text
    if is_myasthenia:
        if is_fluoroquinolone(norm_drug) or is_aminoglycoside(norm_drug):
            offending_class = "Fluoroquinolones" if is_fluoroquinolone(norm_drug) else "Aminoglycosides"
            return RuleViolation(
                tier=1,
                rule_id="TIER1_COMORBIDITY_FATAL_CONTRAINDICATION",
                rule_name="Myasthenia Gravis Neuromuscular Blockade Contraindication",
                severity="BLOCKED",
                drug=drug_name,
                penalty_type="contraindication",
                penalty_score=100.0,
                rationale=(
                    f"Patient has documented Myasthenia Gravis. {drug_name} ({offending_class}) "
                    "carries an FDA Black Box Warning for exacerbating neuromuscular weakness, "
                    "which can precipitate life-threatening acute respiratory muscle paralysis."
                ),
                remediation=(
                    f"Immediately discontinue {drug_name}. Switch to an alternative class without neuromuscular "
                    "blocking activity (e.g. Beta-lactams or Macrolides with close monitoring)."
                ),
                citation="FDA Black Box Warning & Myasthenia Gravis Foundation Clinical Prescribing Safety Guidelines"
            )

    # 2. G6PD Deficiency (Tier 1 Fatal Contraindication)
    is_g6pd = ("g6pd" in history_text) or ("glucose-6-phosphate" in history_text)
    if is_g6pd:
        is_nitro = "nitrofurantoin" in norm_drug
        is_sulfa = is_sulfa_drug(norm_drug)
        if is_nitro or is_sulfa:
            offending_class = "Nitrofurantoin" if is_nitro else "Sulfonamides"
            return RuleViolation(
                tier=1,
                rule_id="TIER1_COMORBIDITY_FATAL_CONTRAINDICATION",
                rule_name="G6PD Deficiency Acute Hemolysis Contraindication",
                severity="BLOCKED",
                drug=drug_name,
                penalty_type="contraindication",
                penalty_score=100.0,
                rationale=(
                    f"Patient has documented G6PD Deficiency. {drug_name} ({offending_class}) "
                    "triggers severe acute oxidative stress in red blood cells, causing life-threatening "
                    "acute intravascular hemolytic anemia and renal tubular hemoglobinuria."
                ),
                remediation=(
                    f"Immediately discontinue {drug_name}. Prescribe non-oxidative antimicrobials "
                    "(e.g., Amoxicillin, Cefalexin, or Fosfomycin for UTI)."
                ),
                citation="WHO Model Formulary & Clinical Pharmacogenetics Implementation Consortium (CPIC) Guidelines"
            )

    # 3. Long QT Syndrome / Cardiac Arrhythmia (Tier 2 High Warning)
    is_qt = any(kw in history_text for kw in ["long qt", "prolonged qt", "torsades", "arrhythmia"])
    if is_qt:
        if is_fluoroquinolone(norm_drug) or is_macrolide_drug(norm_drug):
            offending_class = "Fluoroquinolones" if is_fluoroquinolone(norm_drug) else "Macrolides"
            return RuleViolation(
                tier=2,
                rule_id="TIER2_COMORBIDITY_SERIOUS_WARNING",
                rule_name="Cardiac Arrhythmia / Long QT Prolongation Warning",
                severity="HIGH",
                drug=drug_name,
                penalty_type="contraindication",
                penalty_score=60.0,
                rationale=(
                    f"Patient has documented cardiac conduction disorder / Long QT history. "
                    f"{drug_name} ({offending_class}) causes dose-dependent QT interval prolongation "
                    "and increases the risk of polymorphic ventricular tachycardia (Torsades de Pointes)."
                ),
                remediation=(
                    f"Monitor baseline and serial ECG QTc intervals, or switch to an antimicrobial without "
                    "QT-prolonging potential (e.g., Beta-lactams)."
                ),
                citation="CredibleMeds QT Drugs List & American Heart Association Prescribing Safety Standards"
            )

    # 4. Epilepsy / Seizure Disorder (Tier 2 High Warning)
    is_seizure = any(kw in history_text for kw in ["epilepsy", "seizure", "convulsion"])
    if is_seizure:
        if "imipenem" in norm_drug or is_carbapenem_drug(norm_drug):
            return RuleViolation(
                tier=2,
                rule_id="TIER2_COMORBIDITY_SERIOUS_WARNING",
                rule_name="Seizure Disorder Carbapenem Threshold Warning",
                severity="HIGH",
                drug=drug_name,
                penalty_type="contraindication",
                penalty_score=60.0,
                rationale=(
                    f"Patient has documented seizure disorder / epilepsy. {drug_name} crosses the "
                    "blood-brain barrier and binds GABA receptors, significantly lowering seizure threshold."
                ),
                remediation=(
                    f"Avoid high-dose carbapenems (particularly Imipenem-Cilastatin). If a carbapenem is essential, "
                    "Meropenem exhibits significantly lower neurotoxicity."
                ),
                citation="FDA Package Insert Warnings & Infectious Diseases Society of America (IDSA)"
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


# [SOLID: SRP] — dedicated check for non-canonical/vague diagnostic indications
def check_unmapped_syndrome_advisory(
    canonical_syndrome: Optional[str],
    line: PrescriptionLine,
    has_culture_report: bool = False
) -> Optional[RuleViolation]:
    """
    Tier 2.3: Unconfirmed Indication / Vague Symptom Advisory Gate.
    Prescribing high-potency Watch/Reserve antimicrobials for non-canonical
    symptoms (e.g. 'fever and cough') without culture confirmation triggers
    a soft stewardship advisory (P_indication = 30.0).
    """
    if has_culture_report:
        return None

    drug_name = line.canonical_drug
    aware_tier = get_aware_tier(drug_name, line.aware_tier)

    # Only applies to Watch or Reserve antimicrobials
    if aware_tier not in ["Watch", "Reserve"]:
        return None

    # Check if canonical_syndrome is defined and mapped to a specific diagnosis
    if not canonical_syndrome:
        is_unmapped = True
    else:
        norm_syn = normalize_text(canonical_syndrome)
        # If it's a valid ICMR code (starts with syn_), or contains known specific clinical disease terms
        is_canonical = (
            norm_syn.startswith("syn_")
            or any(d in norm_syn for d in [
                "pneumonia", "cap", "hap", "vap", "urinary tract", "uti", "cystitis", "pyelonephritis",
                "meningitis", "sepsis", "cellulitis", "osteomyelitis", "abscess", "peritonitis",
                "neutropenia", "endocarditis", "strep pharyngitis", "otitis media", "rhinosinusitis",
                "enteric fever", "typhoid", "diabetic foot", "septic arthritis"
            ])
        )
        is_unmapped = not is_canonical

    if is_unmapped:
        syn_display = canonical_syndrome if canonical_syndrome else "Unspecified"
        return RuleViolation(
            tier=2,
            rule_id="TIER2_UNMAPPED_SYNDROME_ADVISORY",
            rule_name="Unconfirmed Indication / Vague Symptom Advisory",
            severity="MEDIUM",
            drug=drug_name,
            penalty_type="indication",
            penalty_score=30.0,
            rationale=(
                f"WHO '{aware_tier}' antimicrobial '{drug_name}' prescribed for non-canonical "
                f"symptom presentation ('{syn_display}') without microbiological confirmation."
            ),
            remediation=(
                "Specify a confirmed ICMR diagnostic syndrome (e.g. CAP, acute bacterial rhinosinusitis) "
                "or obtain culture before initiating broad-spectrum Watch/Reserve therapy."
            ),
            citation="ICMR Standard Treatment Guidelines 2022 & WHO AWaRe Policy"
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


# [SOLID: SRP] — dedicated check for parenteral outpatient administration
def check_outpatient_iv_safeguard(
    line: PrescriptionLine,
    is_outpatient: bool = True,
    has_culture_report: bool = False
) -> Optional[RuleViolation]:
    """
    Tier 3.3: Outpatient Parenteral Antimicrobial Safeguard.
    Flags parenteral/intravenous high-potency antimicrobials prescribed in outpatient
    settings without confirmed microbiology/culture report or documented OPAT supervision.
    Penalty: P_class = 60.0, Severity = HIGH.
    """
    if not is_outpatient or has_culture_report:
        return None

    drug_name = line.canonical_drug
    norm_drug = normalize_text(drug_name)
    route = (line.route or "").lower()

    # Determine if line is IV or restricted outpatient parenteral
    is_iv = any(r in route for r in ["iv", "intra-venous", "intravenous", "infusion", "inj"])
    is_restricted = getattr(line, "outpatient_iv_restricted", False)

    # Class-based check if restricted or high-potency parenteral
    high_potency_parenteral = any(
        d in norm_drug for d in [
            "vancomycin", "teicoplanin", "meropenem", "imipenem", "ertapenem", "doripenem",
            "colistin", "polymyxin b", "amikacin", "gentamicin", "tobramycin", "tigecycline", "ceftazidime"
        ]
    )

    if is_restricted or (is_iv and high_potency_parenteral) or (is_restricted and is_iv):
        return RuleViolation(
            tier=3,
            rule_id="TIER3_OUTPATIENT_IV_SAFEGUARD",
            rule_name="Outpatient Parenteral Antimicrobial Safeguard",
            severity="HIGH",
            drug=drug_name,
            penalty_type="class",
            penalty_score=60.0,
            rationale=(
                f"'{drug_name}' prescribed via intravenous route in an outpatient setting without "
                "documented Outpatient Parenteral Antimicrobial Therapy (OPAT) monitoring or microbiologic "
                "confirmation carries high risk of line infections, nephrotoxicity, and unwarranted broad-spectrum exposure."
            ),
            remediation=(
                "Re-evaluate for hospital admission/OPAT protocol or switch to an evidence-based oral "
                "first-line antimicrobial regimen based on patient clinical stability."
            ),
            citation="IDSA Outpatient Parenteral Antimicrobial Therapy (OPAT) Guidelines & ICMR Stewardship Standards"
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
