from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def extract_prescription():
    """Stub: extract."""
    return {"todo": True}
