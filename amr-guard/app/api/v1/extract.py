from fastapi import APIRouter, HTTPException
from app.schemas.extract import PrescriptionExtractRequest, PrescriptionExtractionResponse
from app.services.extract_service import extract_prescription_from_text

router = APIRouter()

@router.post("/", response_model=PrescriptionExtractionResponse)
def extract_prescription(request: PrescriptionExtractRequest):
    """
    Extract structured clinical entities (patient demographics, prescription lines,
    diagnosis syndrome) from unstructured clinical text or EHR notes.
    """
    try:
        return extract_prescription_from_text(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prescription extraction failed: {str(e)}")
