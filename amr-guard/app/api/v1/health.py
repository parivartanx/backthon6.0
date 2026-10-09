from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def check_health():
    """Stub: health check."""
    return {"status": "ok"}
