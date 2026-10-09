from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def audit_prescription():
    """Stub: audit."""
    return {"todo": True}

@router.post("/from-image")
def audit_prescription_from_image():
    """Stub: audit from image."""
    return {"todo": True}
