from pydantic import BaseModel, Field
from typing import List, Optional

class NormalizedDrug(BaseModel):
    generic_name: str
    drug_class: Optional[str] = None
    is_antibiotic: bool = False
    aware_class: Optional[str] = None
    is_fluoroquinolone: bool = False
    pregnancy_contraindicated: bool = False
    min_age_years: Optional[float] = None
    is_nephrotoxic: bool = False
    requires_egfr: bool = False
    min_egfr_safe: float = 30.0
    is_geriatric_contraindicated: bool = False
    requires_tdm: bool = False
    outpatient_iv_restricted: bool = False

class NormalizedRule(BaseModel):
    code: str
    description: str
    severity: str
    citation: Optional[str] = None
    enabled: bool = True

class IngestionResult(BaseModel):
    drugs: List[NormalizedDrug] = Field(default_factory=list)
    rules: List[NormalizedRule] = Field(default_factory=list)
