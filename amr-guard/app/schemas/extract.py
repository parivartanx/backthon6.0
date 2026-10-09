"""
Pydantic schemas for prescription entity extraction (NLP & OCR).
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.patient import PatientContext
from app.schemas.prescription import PrescriptionLine

class PrescriptionExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw clinical prescription or consultation text")

class PrescriptionExtractionResponse(BaseModel):
    patient: PatientContext = Field(..., description="Extracted patient context")
    prescription_lines: List[PrescriptionLine] = Field(default_factory=list, description="Extracted medication items")
    canonical_syndrome: Optional[str] = Field(None, description="Inferred or extracted clinical syndrome")
    is_outpatient: bool = Field(True, description="Whether care setting is outpatient")
    confidence_score: float = Field(0.9, ge=0.0, le=1.0, description="Extraction confidence score")
    raw_text: Optional[str] = Field(None, description="Original source text or OCR transcription")
