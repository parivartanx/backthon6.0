from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine
from app.schemas.remediation import RemediationOption

class RuleViolation(BaseModel):
    tier: int = Field(..., description="Pipeline tier: 1 to 5")
    rule_id: str = Field(..., description="Unique rule identifier (e.g., TIER1_PEDIATRIC_FQ)")
    rule_name: str = Field(..., description="Human-readable rule name")
    severity: str = Field(..., description="Severity level: BLOCKED, HIGH, MEDIUM, LOW")
    drug: Optional[str] = Field(None, description="Involved drug name")
    penalty_type: Optional[str] = Field(None, description="Penalty category: contraindication, indication, class, duration, resistance, fdc")
    penalty_score: float = Field(0.0, description="Mathematical penalty points allocated")
    rationale: str = Field(..., description="Clinical mechanism / rationale for rule failure")
    remediation: Optional[str] = Field(None, description="Immediate corrective recommendation")
    citation: Optional[str] = Field(None, description="Guideline or surveillance reference")

class PenaltiesBreakdown(BaseModel):
    p_class: float = Field(0.0, description="WHO AWaRe class penalty points (Tier 3)")
    p_duration: float = Field(0.0, description="Excessive duration penalty points (Tier 4)")
    p_indication: float = Field(0.0, description="Unindicated / viral infection penalty points (Tier 2)")

class AuditResult(BaseModel):
    status: str = Field(..., description="Overall status: BLOCKED, FLAGGED, APPROVED")
    score: float = Field(..., description="AMR Risk Score bounded between 0.0 and 100.0")
    band: str = Field(..., description="Triage band: GREEN (Low Risk), AMBER (Review), RED (Critical/Blocked)")
    penalties: PenaltiesBreakdown = Field(default_factory=PenaltiesBreakdown)
    flags: List[RuleViolation] = Field(default_factory=list, description="List of rule violations tripped")
    remediation_options: List[RemediationOption] = Field(default_factory=list, description="Actionable interventions")
    latency_ms: int = Field(0, description="Execution latency in milliseconds")

class PrescriptionAuditRequest(BaseModel):
    scenario: Optional[str] = Field(None, description="Unstructured clinical text scenario")
    patient: Optional[PatientContext] = Field(None, description="Structured patient clinical context")
    prescription_lines: List[PrescriptionLine] = Field(default_factory=list, description="Prescribed medications")
    canonical_syndrome: Optional[str] = Field(None, description="Diagnostic syndrome code or label")
    has_culture_report: bool = Field(False, description="Whether a culture / sensitivity report exists")
    has_positive_microbiology: bool = Field(False, description="Whether positive microbiology ID is confirmed")
    is_outpatient: bool = Field(True, description="Consultation setting: True for Outpatient, False for Inpatient")
