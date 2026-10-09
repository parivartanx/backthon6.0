from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def remediate_prescription():
    """Stub: remediate."""
    return {"todo": True}
