from pydantic import BaseModel, Field
from typing import Optional

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

    @property
    def canonical_drug(self) -> str:
        """Helper to get primary drug name representation."""
        return (self.generic or self.drug_name or self.brand or self.raw_text or "").strip()
