from pydantic import BaseModel
from typing import Optional

class PatientContext(BaseModel):
    age_years: int
    sex: str
    is_pregnant: bool
    weight_kg: Optional[float] = None
    diagnosis_text: str
