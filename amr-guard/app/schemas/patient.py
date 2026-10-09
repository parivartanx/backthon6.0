from pydantic import BaseModel, Field
from typing import Optional

class PatientContext(BaseModel):
    age_years: int = Field(..., description="Age of patient in years")
    sex: str = Field("unknown", description="Patient biological sex (M/F/Other)")
    is_pregnant: bool = Field(False, description="Whether patient is currently pregnant")
    weight_kg: Optional[float] = Field(None, description="Patient weight in kg")
    egfr: Optional[float] = Field(None, description="Estimated Glomerular Filtration Rate in mL/min/1.73m^2")
    allergies: Optional[str] = Field("NKDA", description="Documented patient drug allergies")
    medical_history: Optional[str] = Field(None, description="Relevant clinical comorbidities and medical history")
    diagnosis_text: Optional[str] = Field(None, description="Original clinical diagnosis or symptoms text")

    @property
    def patient_age(self) -> int:
        return self.age_years
