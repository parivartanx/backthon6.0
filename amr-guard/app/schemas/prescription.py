from pydantic import BaseModel
from typing import Optional

class PrescriptionLine(BaseModel):
    raw_text: str
    brand: Optional[str] = None
    generic: Optional[str] = None
    strength: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    confidence: Optional[float] = None
