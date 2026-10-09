"""
Knowledge Chunking and Vector Ingestion Router for AMR-Guard.

Provides endpoints to:
1. Upload and structure-aware chunk PDF, TXT, and Markdown files (POST /upload).
2. Inspect knowledge chunks and stats (GET /stats, GET /chunks).
3. Perform vector similarity searches (POST /search).
4. Ingest/seed default clinical AMR knowledge base into Neon Postgres (POST /seed-default).
"""

from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException, status
from app.schemas.knowledge import (
    KnowledgeUploadResponse,
    KnowledgeStatsResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResult,
    SeedKnowledgeResponse,
    ChunkItem,
)
from app.services.knowledge_service import (
    ingest_file_content,
    get_knowledge_stats,
    get_chunks_list,
    search_vector_chunks,
    seed_default_knowledge_base,
)

router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "txt", "md", "markdown"}


@router.post("/upload", response_model=KnowledgeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_knowledge_file(
    file: UploadFile = File(..., description="Document file (.pdf, .txt, or .md)"),
    target_chunk_size: int = Form(1000, ge=200, le=4000, description="Target character size per chunk"),
):
    """
    Upload and ingest clinical documents (PDF, Markdown, or Plain Text) with
    structure-aware chunking, hierarchical context enrichment, and 768-dimensional
    vector embeddings stored directly in Neon PostgreSQL knowledge_chunks.
    """
    filename = file.filename or "uploaded_document.txt"
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Allowed types are: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    try:
        raw_bytes = await file.read()
        if not raw_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        response = ingest_file_content(
            filename=filename,
            raw_bytes=raw_bytes,
            target_chunk_size=target_chunk_size,
        )
        return response

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge chunking and ingestion failed: {str(e)}",
        )


@router.get("/stats", response_model=KnowledgeStatsResponse)
def get_stats():
    """
    Get summary statistics of stored knowledge chunks in Neon Postgres.
    """
    try:
        return get_knowledge_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch knowledge statistics: {str(e)}",
        )


@router.get("/chunks", response_model=List[ChunkItem])
def list_chunks(
    limit: int = Query(50, ge=1, le=200, description="Max chunks to retrieve"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    source_id: Optional[str] = Query(None, description="Filter by source file name"),
):
    """
    List paginated knowledge chunks from Neon PostgreSQL.
    """
    try:
        return get_chunks_list(limit=limit, offset=offset, source_id=source_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chunks: {str(e)}",
        )


@router.post("/search", response_model=List[KnowledgeSearchResult])
def search_knowledge(request: KnowledgeSearchRequest):
    """
    Perform dense vector semantic similarity search using pgvector cosine distance
    against indexed clinical guidelines.
    """
    try:
        return search_vector_chunks(
            query=request.query,
            limit=request.limit,
            source_id=request.source_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector search failed: {str(e)}",
        )


@router.post("/seed-default", response_model=SeedKnowledgeResponse)
def seed_default_knowledge(
    max_chunks: Optional[int] = Query(
        50,
        ge=1,
        le=500,
        description="Maximum initial chunks to embed and store from default AMR knowledge base",
    )
):
    """
    Seed/prime the Neon PostgreSQL knowledge_chunks table using the repository's
    verified AMR_KNOWLEDGE_BASE.md guideline document.
    """
    try:
        return seed_default_knowledge_base(max_chunks=max_chunks)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed default knowledge base: {str(e)}",
        )
