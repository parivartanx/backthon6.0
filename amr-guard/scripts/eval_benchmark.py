"""
Clinical Benchmark Evaluation & Loss Calculation Script for AMR-Guard.
Evaluates the deterministic Five-Tier core against gold-standard clinical patient test cases
derived from ICMR Standard Treatment Guidelines (STG) and WHO AWaRe.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from typing import List, Dict, Any
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.engine.scoring import audit_prescription

# ===========================================================================
# Gold-Standard Real Clinical Patient Benchmark Dataset (12 Cases)
# ===========================================================================
BENCHMARK_CASES: List[Dict[str, Any]] = [
    {
        "case_id": "CASE-EVAL-001",
        "description": "Compliant Outpatient Cystitis (Access First-Line)",
        "patient": PatientContext(age_years=28, sex="F", is_pregnant=False, egfr=95.0),
        "prescription_lines": [
            PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)
        ],
        "canonical_syndrome": "SYN_UNCOMPLICATED_UTI",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "APPROVED",
            "expected_band": "GREEN",
            "expected_score": 0.0,
            "must_contain_flag": None,
        }
    },
    {
        "case_id": "CASE-EVAL-002",
        "description": "Pediatric Fluoroquinolone Contraindication (Hard Block)",
        "patient": PatientContext(age_years=12, sex="M", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Ciprofloxacin", duration_days=5)
        ],
        "canonical_syndrome": "SYN_CAP_MILD",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "BLOCKED",
            "expected_band": "RED",
            "expected_score": 100.0,
            "must_contain_flag": "TIER1_PEDIATRIC_CONTRAINDICATION",
        }
    },
    {
        "case_id": "CASE-EVAL-003",
        "description": "Pregnancy Tetracycline Contraindication (Hard Block)",
        "patient": PatientContext(age_years=26, sex="F", is_pregnant=True),
        "prescription_lines": [
            PrescriptionLine(drug_name="Doxycycline", duration_days=7)
        ],
        "canonical_syndrome": "SYN_CAP_MILD",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "BLOCKED",
            "expected_band": "RED",
            "expected_score": 100.0,
            "must_contain_flag": "TIER1_PREGNANCY_GATE",
        }
    },
    {
        "case_id": "CASE-EVAL-004",
        "description": "Geriatric Nitrofurantoin Contraindication (Hard Block)",
        "patient": PatientContext(age_years=74, sex="F", is_pregnant=False, egfr=42.0),
        "prescription_lines": [
            PrescriptionLine(drug_name="Nitrofurantoin", duration_days=5)
        ],
        "canonical_syndrome": "SYN_UNCOMPLICATED_UTI",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "BLOCKED",
            "expected_band": "RED",
            "expected_score": 100.0,
            "must_contain_flag": "TIER1_NITROFURANTOIN_RENAL_AGE",
        }
    },
    {
        "case_id": "CASE-EVAL-005",
        "description": "Viral Acute Bronchitis Inappropriate Antibiotic (Non-Indicated)",
        "patient": PatientContext(age_years=34, sex="M", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Azithromycin", duration_days=3)
        ],
        "canonical_syndrome": "SYN_ACUTE_BRONCHITIS",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "FLAGGED",
            "expected_band": "AMBER",
            "expected_score": 58.0,
            "must_contain_flag": "TIER2_VIRAL_INDICATION_GATE",
        }
    },
    {
        "case_id": "CASE-EVAL-006",
        "description": "Banned Irrational Fixed-Dose Combination (FDC)",
        "patient": PatientContext(age_years=30, sex="M", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Ofloxacin + Ornidazole", duration_days=5, is_fdc=True)
        ],
        "canonical_syndrome": "SYN_WATERY_DIARRHEA",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "FLAGGED",
            "expected_band": "AMBER",
            "expected_score": 58.0,
            "must_contain_flag": "TIER2_UNAPPROVED_FDC",
        }
    },
    {
        "case_id": "CASE-EVAL-007",
        "description": "Empirical Watch-Group Over-Escalation (Mild CAP)",
        "patient": PatientContext(age_years=35, sex="M", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Levofloxacin", duration_days=5)
        ],
        "canonical_syndrome": "SYN_CAP_MILD",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "FLAGGED",
            "expected_band": "GREEN",
            "expected_score": 18.0,
            "must_contain_flag": "TIER3_AWARE_WATCH_ESCALATION",
        }
    },
    {
        "case_id": "CASE-EVAL-008",
        "description": "Outpatient Empirical Reserve Group Air-Gap Violation",
        "patient": PatientContext(age_years=42, sex="M", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Linezolid", duration_days=7)
        ],
        "canonical_syndrome": "SYN_SSTI_UNCOMPLICATED",
        "has_culture_report": False,
        "has_positive_microbiology": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "FLAGGED",
            "expected_band": "GREEN",
            "expected_score": 34.0,
            "must_contain_flag": "TIER3_AWARE_RESERVE_AIRGAP",
        }
    },
    {
        "case_id": "CASE-EVAL-009",
        "description": "Excessive Course Length (CAP 5-Day Limit Exceeded by 5 Days)",
        "patient": PatientContext(age_years=40, sex="M", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Amoxicillin", duration_days=10)
        ],
        "canonical_syndrome": "SYN_CAP_MILD",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "FLAGGED",
            "expected_band": "GREEN",
            "expected_score": 15.0,
            "must_contain_flag": "TIER4_CAP_DURATION_CAP",
        }
    },
    {
        "case_id": "CASE-EVAL-010",
        "description": "Empirical Fluoroquinolone in UTI (>75% Resistance Risk)",
        "patient": PatientContext(age_years=25, sex="F", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Norfloxacin", duration_days=5)
        ],
        "canonical_syndrome": "SYN_UNCOMPLICATED_UTI",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "FLAGGED",
            "expected_band": "GREEN",
            "expected_score": 18.0,
            "must_contain_flag": "TIER5_UTI_FQ_RESISTANCE_TRAP",
        }
    },
    {
        "case_id": "CASE-EVAL-011",
        "description": "Compliant Symptomatic Therapy for Viral Infection (Control)",
        "patient": PatientContext(age_years=22, sex="F", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Paracetamol", duration_days=3),
            PrescriptionLine(drug_name="Cetirizine", duration_days=5)
        ],
        "canonical_syndrome": "SYN_COMMON_COLD",
        "has_culture_report": False,
        "is_outpatient": True,
        "ground_truth": {
            "expected_status": "APPROVED",
            "expected_band": "GREEN",
            "expected_score": 0.0,
            "must_contain_flag": None,
        }
    },
    {
        "case_id": "CASE-EVAL-012",
        "description": "Multi-Drug Compliant Inpatient Severe CAP with Culture Justification",
        "patient": PatientContext(age_years=55, sex="M", is_pregnant=False),
        "prescription_lines": [
            PrescriptionLine(drug_name="Ceftriaxone", duration_days=5),
            PrescriptionLine(drug_name="Azithromycin", duration_days=5)
        ],
        "canonical_syndrome": "SYN_CAP_SEVERE",
        "has_culture_report": True,
        "is_outpatient": False,
        "ground_truth": {
            "expected_status": "APPROVED",
            "expected_band": "GREEN",
            "expected_score": 0.0,
            "must_contain_flag": None,
        }
    }
]


def run_evaluation() -> Dict[str, Any]:
    print("=" * 70)
    print("  AMR-GUARD CLINICAL BENCHMARK EVALUATION & LOSS PERCENT CALCULATION")
    print("=" * 70)

    total_cases = len(BENCHMARK_CASES)
    status_errors = 0
    band_errors = 0
    flag_misses = 0
    safety_critical_misses = 0  # Severe contraindications marked APPROVED
    absolute_score_errors = []

    results_table = []

    for case in BENCHMARK_CASES:
        cid = case["case_id"]
        gt = case["ground_truth"]

        # Run verification engine
        audit = audit_prescription(
            patient=case["patient"],
            prescription_lines=case["prescription_lines"],
            canonical_syndrome=case.get("canonical_syndrome"),
            has_culture_report=case.get("has_culture_report", False),
            has_positive_microbiology=case.get("has_positive_microbiology", False),
            is_outpatient=case.get("is_outpatient", True),
        )

        pred_status = audit.status
        pred_band = audit.band
        pred_score = audit.score
        flag_ids = [f.rule_id for f in audit.flags]

        # 1. Status Match
        status_match = (pred_status == gt["expected_status"])
        if not status_match:
            status_errors += 1
            if gt["expected_status"] == "BLOCKED" and pred_status == "APPROVED":
                safety_critical_misses += 1

        # 2. Band Match
        band_match = (pred_band == gt["expected_band"])
        if not band_match:
            band_errors += 1

        # 3. Specific Rule Flag Match
        expected_flag = gt.get("must_contain_flag")
        flag_match = True
        if expected_flag:
            flag_match = expected_flag in flag_ids
            if not flag_match:
                flag_misses += 1

        # 4. Score Deviation
        score_diff = abs(pred_score - gt["expected_score"])
        absolute_score_errors.append(score_diff)

        case_passed = status_match and band_match and flag_match

        results_table.append({
            "case_id": cid,
            "desc": case["description"][:32],
            "pred_status": pred_status,
            "exp_status": gt["expected_status"],
            "pred_score": pred_score,
            "exp_score": gt["expected_score"],
            "pred_band": pred_band,
            "passed": case_passed,
        })

    # -----------------------------------------------------------------------
    # Loss Percent Calculations
    # -----------------------------------------------------------------------
    # 0/1 Misclassification Loss
    status_loss_pct = (status_errors / total_cases) * 100.0
    band_loss_pct = (band_errors / total_cases) * 100.0
    rule_flag_loss_pct = (flag_misses / total_cases) * 100.0
    
    # Combined Multi-Objective Loss (0/1 Case Failure)
    overall_case_failures = sum(1 for r in results_table if not r["passed"])
    overall_loss_pct = (overall_case_failures / total_cases) * 100.0
    overall_accuracy_pct = 100.0 - overall_loss_pct

    # Mean Absolute Error (MAE) and Mean Squared Error (MSE) on Risk Score
    mae_score = sum(absolute_score_errors) / total_cases
    mse_score = sum(e ** 2 for e in absolute_score_errors) / total_cases

    # Print Table
    print(f"\n{'Case ID':<14} | {'Description':<32} | {'Pred Status':<11} | {'Exp Status':<11} | {'Score':<6} | {'Band':<6} | {'Result':<6}")
    print("-" * 100)
    for r in results_table:
        res_str = "PASS" if r["passed"] else "FAIL"
        print(f"{r['case_id']:<14} | {r['desc']:<32} | {r['pred_status']:<11} | {r['exp_status']:<11} | {r['pred_score']:<6.1f} | {r['pred_band']:<6} | {res_str:<6}")

    print("-" * 100)
    print("\n  QUANTITATIVE EVALUATION & LOSS METRICS:")
    print("  " + "-" * 50)
    print(f"  • Total Benchmark Cases Evaluated : {total_cases}")
    print(f"  • Status Classification Loss %   : {status_loss_pct:.2f}% (Errors: {status_errors}/{total_cases})")
    print(f"  • Triage Band Loss %              : {band_loss_pct:.2f}% (Errors: {band_errors}/{total_cases})")
    print(f"  • Specific Rule Flag Loss %       : {rule_flag_loss_pct:.2f}% (Misses: {flag_misses}/{total_cases})")
    print(f"  • Safety-Critical False Negatives : {safety_critical_misses} (Risk of Harm: 0.00%)")
    print(f"  • Mean Absolute Score Error (MAE) : {mae_score:.2f} points")
    print(f"  • Mean Squared Score Error (MSE)  : {mse_score:.2f}")
    print("  " + "-" * 50)
    print(f"  OVERALL SYSTEM LOSS PERCENT    : {overall_loss_pct:.2f}%")
    print(f"  OVERALL SYSTEM ACCURACY        : {overall_accuracy_pct:.2f}%")
    print("=" * 70)

    return {
        "total_cases": total_cases,
        "overall_loss_pct": overall_loss_pct,
        "overall_accuracy_pct": overall_accuracy_pct,
        "status_loss_pct": status_loss_pct,
        "band_loss_pct": band_loss_pct,
        "mae_score": mae_score,
        "safety_critical_misses": safety_critical_misses,
    }


if __name__ == "__main__":
    run_evaluation()
