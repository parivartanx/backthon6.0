"""
Schemas for antimicrobial remediation, de-escalation, and guideline recommendations.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.patient import PatientContext

class RemediationOption(BaseModel):
    recommendation_type: str = Field(
        ...,
        description="Type of intervention: SWITCH_DRUG, DISCONTINUE, REDUCE_DURATION, MANDATE_SYMPTOMATIC, MICROBIOLOGY_REQUIRED, CONTRAINDICATION_BLOCK"
    )
    suggested_drug: Optional[str] = Field(None, description="Suggested alternative antimicrobial or supportive agent")
    suggested_duration_days: Optional[int] = Field(None, description="Recommended course duration in days")
    guidance: str = Field(..., description="Actionable clinical guidance text")
    source_citation: Optional[str] = Field(None, description="Guideline citation (e.g. ICMR STG, WHO AWaRe)")

class RemediationRequest(BaseModel):
    canonical_syndrome: Optional[str] = Field(None, description="Diagnostic syndrome (e.g. SYN_CAP_MILD, SYN_UNCOMPLICATED_UTI)")
    flagged_drug: Optional[str] = Field(None, description="Specifically flagged or unindicated drug needing substitution")
    patient: Optional[PatientContext] = Field(None, description="Patient context (age, pregnancy, renal function) to tailor safe options")

class RemediationResponse(BaseModel):
    canonical_syndrome: Optional[str] = Field(None, description="Resolved clinical syndrome")
    first_line_access_regimen: Optional[str] = Field(None, description="Standard ICMR / WHO Access first-line regimen")
    options: List[RemediationOption] = Field(default_factory=list, description="List of safe remediation alternatives")
    stewardship_guidance: str = Field(..., description="Summary clinical advice and stewardship rationale")
