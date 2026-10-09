from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.extract import PrescriptionExtractRequest, PrescriptionExtractionResponse
from app.services.extract_service import (
    extract_prescription_from_text,
    extract_prescription_from_document,
)

router = APIRouter()

@router.post("", response_model=PrescriptionExtractionResponse)
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


@router.post("/document", response_model=PrescriptionExtractionResponse)
@router.post("/document/", response_model=PrescriptionExtractionResponse)
async def extract_prescription_from_file(file: UploadFile = File(...)):
    """
    Extract structured clinical entities directly from an uploaded PDF or image prescription document.
    """
    try:
        content_type = file.content_type or "application/octet-stream"
        filename = file.filename or ""
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        return extract_prescription_from_document(
            file_bytes=file_bytes,
            content_type=content_type,
            filename=filename,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document extraction failed: {str(e)}")

