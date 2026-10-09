from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone

class PrescriptionLine(BaseModel):
    raw_text: Optional[str] = Field(None, description="Raw prescription text line")
    drug_name: Optional[str] = Field(None, description="Prescribed brand or drug name")
    brand: Optional[str] = Field(None, description="Commercial brand name if specified")
    generic: Optional[str] = Field(None, description="Generic drug name")
    strength: Optional[str] = Field(None, description="Strength (e.g., 500mg)")
    frequency: Optional[str] = Field(None, description="Dosing frequency (e.g., BD, TDS, OD)")
    duration_days: Optional[int] = Field(None, description="Duration in days")
    confidence: Optional[float] = Field(None, description="Extraction confidence score")
    aware_tier: Optional[str] = Field(None, description="WHO AWaRe tier: Access, Watch, Reserve")
    drug_class: Optional[str] = Field(None, description="Pharmacological class")
    is_fdc: Optional[bool] = Field(None, description="Whether the drug is a fixed-dose combination")
    route: Optional[str] = Field("Oral", description="Route of administration (e.g. Oral, Intravenous)")
    is_nephrotoxic: Optional[bool] = Field(False, description="Nephrotoxic potential")
    requires_egfr: Optional[bool] = Field(False, description="Requires baseline eGFR monitoring")
    min_egfr_safe: Optional[float] = Field(30.0, description="Minimum safe eGFR cut-off")
    requires_tdm: Optional[bool] = Field(False, description="Requires therapeutic drug monitoring")
    outpatient_iv_restricted: Optional[bool] = Field(False, description="Restricted for unmonitored outpatient IV infusion")

    @property
    def canonical_drug(self) -> str:
        """Helper to get primary drug name representation."""
        return (self.generic or self.drug_name or self.brand or self.raw_text or "").strip()


class MedicineEntry(BaseModel):
    id: str = Field(..., description="Unique medication line identifier")
    brandName: str = Field("", description="Commercial brand name")
    genericName: str = Field("", description="Generic pharmacological name")
    strength: str = Field("", description="Strength specification")
    dose: str = Field("", description="Prescribed dose")
    route: str = Field("Oral", description="Route of administration")
    frequency: str = Field("", description="Dosing frequency")
    duration: str = Field("", description="Duration string representation")
    duration_days: Optional[int] = Field(None, description="Standardized duration in days")
    aware_tier: Optional[str] = Field("Access", description="WHO AWaRe tier")
    drug_class: Optional[str] = Field(None, description="Pharmacological class")
    is_fdc: Optional[bool] = Field(False, description="Whether drug is fixed-dose combination")
    confidence: Optional[float] = Field(1.0, description="Extraction confidence score")
    verificationStatus: str = Field("Verified", description="Verification status: Verified, Needs Verification, Missing")
    is_nephrotoxic: Optional[bool] = Field(False, description="Nephrotoxicity potential")
    requires_egfr: Optional[bool] = Field(False, description="Requires baseline renal panel")
    requires_tdm: Optional[bool] = Field(False, description="Requires therapeutic drug monitoring")
    outpatient_iv_restricted: Optional[bool] = Field(False, description="Restricted outpatient IV infusion")


class PatientCaseContext(BaseModel):
    caseId: str = Field(..., description="Unique case identifier")
    age: Union[int, float, str] = Field(..., description="Patient age")
    age_years: Optional[int] = Field(None, description="Patient age in years")
    sex: str = Field("Other", description="Patient sex")
    pregnancyStatus: str = Field("Not applicable", description="Pregnancy status")
    is_pregnant: Optional[bool] = Field(False, description="Boolean pregnancy flag")
    weight_kg: Optional[Union[float, str]] = Field(None, description="Patient weight in kg")
    egfr: Optional[Union[float, str]] = Field(None, description="Estimated eGFR in mL/min")
    allergies: str = Field("NKDA", description="Documented drug allergies")
    symptoms: str = Field("", description="Presenting symptoms")
    medicalHistory: str = Field("", description="Past medical history")
    suspectedDiagnosis: str = Field("", description="Preliminary clinical diagnosis")
    canonical_syndrome: Optional[str] = Field(None, description="Standardized syndrome code")
    has_culture_report: Optional[bool] = Field(False, description="Culture & sensitivity availability")
    has_positive_microbiology: Optional[bool] = Field(False, description="Positive microbiology flag")
    is_outpatient: Optional[bool] = Field(True, description="Outpatient consultation setting")


class PrescriptionCase(BaseModel):
    id: str = Field(..., description="Unique case ID")
    sourceType: str = Field("manual", description="Source format: upload or manual")
    sourceText: str = Field("", description="Original or transcribed prescription text")
    imagePreviewUrl: Optional[str] = Field(None, description="Uploaded image URL")
    imageFileName: Optional[str] = Field(None, description="Uploaded image filename")
    patient: PatientCaseContext = Field(..., description="Patient demographic and clinical context")
    medicines: List[MedicineEntry] = Field(default_factory=list, description="Prescribed medications")
    workflowStatus: str = Field("Ready for Audit", description="Status: Draft, Extraction Complete, Needs Verification, Ready for Audit, Audited")
    auditResult: Optional[Dict[str, Any]] = Field(None, description="Clinical verification and audit result")
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
