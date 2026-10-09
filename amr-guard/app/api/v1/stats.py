from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_stats():
    """Stub: stats."""
    return {"todo": True}
