from fastapi import APIRouter

router = APIRouter()

@router.get("/")
@router.get("/health")
def check_health():
    """Health check endpoint."""
    return {"status": "ok", "service": "AMR-Guard API"}
