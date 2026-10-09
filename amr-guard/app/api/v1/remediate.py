from fastapi import APIRouter, HTTPException
from app.schemas.remediation import RemediationRequest, RemediationResponse
from app.services.remediation_service import get_remediation_guidance

router = APIRouter()

@router.post("/", response_model=RemediationResponse)
def remediate_prescription(request: RemediationRequest):
    """
    Look up clinical remediation guidance, guideline first-line Access regimens,
    and safe de-escalation substitutions for flagged prescriptions.
    """
    try:
        return get_remediation_guidance(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Remediation calculation failed: {str(e)}")
