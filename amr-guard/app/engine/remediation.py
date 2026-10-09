"""
Remediation and Stewardship Recommendation Generator for AMR-Guard.
Converts deterministic rule flags into clear, actionable clinical interventions.
"""
from typing import List
from app.schemas.audit import RuleViolation
from app.schemas.remediation import RemediationOption

def generate_remediations(violations: List[RuleViolation]) -> List[RemediationOption]:
    """
    Generate structured, de-duplicated clinical remediation recommendations
    from tripped rule violations.
    """
    remediations: List[RemediationOption] = []
    seen_guidance = set()

    for v in violations:
        rec_type = "SWITCH_DRUG"
        suggested_drug = None
        suggested_duration = None

        if v.tier == 1:
            rec_type = "CONTRAINDICATION_BLOCK"
            if "Pediatric" in v.rule_name:
                suggested_drug = "Amoxicillin or Cephalexin (Pediatric Safe)"
            elif "Pregnancy" in v.rule_name:
                suggested_drug = "Amoxicillin or Cefixime (Category B)"
            elif "Nitrofurantoin" in v.rule_name:
                suggested_drug = "Oral Fosfomycin (single dose)"
        elif v.tier == 2:
            if "NSAID" in v.rule_name or "Duplication" in v.rule_name:
                rec_type = "SWITCH_DRUG"
                suggested_drug = "Paracetamol (single-agent symptomatic therapy)"
                suggested_duration = 3
            elif "Viral" in v.rule_name or v.penalty_type == "indication":
                rec_type = "MANDATE_SYMPTOMATIC"
                suggested_drug = "ORS + Zinc (if diarrhea) / Paracetamol (if URTI)"
                suggested_duration = 0
            elif "FDC" in v.rule_name:
                rec_type = "DISCONTINUE"
                suggested_drug = "Rational single-agent narrow-spectrum alternative"
        elif v.tier == 3:
            if "Watch" in v.rule_name:
                rec_type = "SWITCH_DRUG"
                suggested_drug = "Access Group First-Line Alternative (e.g., Amoxicillin, Nitrofurantoin)"
            elif "Reserve" in v.rule_name:
                rec_type = "MICROBIOLOGY_REQUIRED"
                suggested_drug = None
        elif v.tier == 4:
            rec_type = "REDUCE_DURATION"
            suggested_drug = v.drug
            if "CAP" in v.rule_name or "Nitrofurantoin" in v.rule_name:
                suggested_duration = 5
            elif "Fosfomycin" in v.rule_name:
                suggested_duration = 1
        elif v.tier == 5:
            rec_type = "SWITCH_DRUG"
            suggested_drug = "Nitrofurantoin (100mg BD for 5 days) or Fosfomycin (3g single dose)"
            suggested_duration = 5

        guidance_text = v.remediation or v.rationale
        if guidance_text in seen_guidance:
            continue
        seen_guidance.add(guidance_text)

        remediations.append(
            RemediationOption(
                recommendation_type=rec_type,
                suggested_drug=suggested_drug,
                suggested_duration_days=suggested_duration,
                guidance=guidance_text,
                source_citation=v.citation,
            )
        )

    return remediations
