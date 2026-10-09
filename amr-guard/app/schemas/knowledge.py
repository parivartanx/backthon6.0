from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChunkMetadata(BaseModel):
    source_id: str
    file_type: str
    chunk_index: int
    total_chunks: Optional[int] = None
    section_breadcrumb: Optional[str] = None
    page_number: Optional[int] = None
    char_count: int
    extra: Dict[str, Any] = Field(default_factory=dict)

class ChunkItem(BaseModel):
    id: int
    source_id: Optional[str] = None
    chunk_text: str
    metadata_json: Optional[Dict[str, Any]] = None

class KnowledgeUploadResponse(BaseModel):
    status: str
    filename: str
    source_id: str
    file_type: str
    chunks_created: int
    latency_ms: int
    preview_chunks: List[str] = Field(default_factory=list)

class KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., description="Clinical question, condition, or antibiotic regimen")
    limit: int = Field(default=5, ge=1, le=50, description="Max number of relevant chunks to return")
    source_id: Optional[str] = Field(default=None, description="Optional filter by source_id")

class KnowledgeSearchResult(BaseModel):
    id: int
    source_id: Optional[str]
    chunk_text: str
    similarity_score: float
    metadata_json: Optional[Dict[str, Any]] = None

class KnowledgeStatsResponse(BaseModel):
    total_chunks: int
    sources: Dict[str, int] = Field(default_factory=dict)

class SeedKnowledgeResponse(BaseModel):
    status: str
    source_id: str
    chunks_created: int
    latency_ms: int
