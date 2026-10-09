"""
Knowledge Service for AMR-Guard.

Orchestrates:
1. File chunking and 768-d embedding generation for PDF, TXT, and Markdown.
2. Upsert/replace persistence into PostgreSQL/Neon knowledge_chunks table.
3. Cosine-similarity vector search over knowledge chunks.
4. Summary and chunk inspection.
5. Seeding default AMR clinical knowledge base.
"""

import os
import time
import logging
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from sqlalchemy import select, delete, func
from app.db.session import SessionLocal
from app.db.models import KnowledgeChunk
from app.services.chunking_service import chunk_document
from app.services.embedding_service import (
    generate_batch_embeddings,
    generate_single_embedding,
)
from app.schemas.knowledge import (
    KnowledgeUploadResponse,
    KnowledgeSearchResult,
    KnowledgeStatsResponse,
    SeedKnowledgeResponse,
    ChunkItem,
)

logger = logging.getLogger("amr_guard.knowledge")


def ingest_file_content(
    filename: str,
    raw_bytes: bytes,
    target_chunk_size: int = 1000,
) -> KnowledgeUploadResponse:
    """
    Parse, chunk, embed, and store document chunks in knowledge_chunks table.
    Replaces existing records with the same filename/source_id.
    """
    start_time = time.time()
    ext = filename.lower().split(".")[-1] if "." in filename else "txt"
    source_id = filename

    # 1. Structure-aware chunking
    chunks_with_meta = chunk_document(
        filename=filename,
        raw_bytes=raw_bytes,
        target_size=target_chunk_size,
    )

    if not chunks_with_meta:
        raise ValueError(f"No extractable text or content found in {filename}.")

    chunk_texts = [text for text, _ in chunks_with_meta]

    # 2. Dense 768-d vector embedding generation
    embeddings = generate_batch_embeddings(chunk_texts)

    # 3. Database persistence with Upsert/Replace logic
    db = SessionLocal()
    try:
        # Delete prior chunks for this source_id
        db.execute(delete(KnowledgeChunk).where(KnowledgeChunk.source_id == source_id))

        # Insert new chunks
        new_objects = []
        for (text, meta), emb in zip(chunks_with_meta, embeddings):
            new_objects.append(
                KnowledgeChunk(
                    source_id=source_id,
                    chunk_text=text,
                    embedding=emb,
                    metadata_json=meta,
                )
            )

        db.add_all(new_objects)
        db.commit()

        latency_ms = int((time.time() - start_time) * 1000)

        preview = [t[:160] + "..." if len(t) > 160 else t for t in chunk_texts[:3]]

        return KnowledgeUploadResponse(
            status="success",
            filename=filename,
            source_id=source_id,
            file_type=ext,
            chunks_created=len(new_objects),
            latency_ms=latency_ms,
            preview_chunks=preview,
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to persist knowledge chunks for {filename}: {e}")
        raise e
    finally:
        db.close()


def get_knowledge_stats() -> KnowledgeStatsResponse:
    """Get total chunks count and breakdown by source_id."""
    db = SessionLocal()
    try:
        total = db.query(func.count(KnowledgeChunk.id)).scalar() or 0

        # Group count by source_id
        source_counts_stmt = select(
            KnowledgeChunk.source_id,
            func.count(KnowledgeChunk.id),
        ).group_by(KnowledgeChunk.source_id)

        rows = db.execute(source_counts_stmt).all()
        sources_dict = {
            (r[0] or "unknown"): r[1] for r in rows
        }

        return KnowledgeStatsResponse(
            total_chunks=total,
            sources=sources_dict,
        )
    finally:
        db.close()


def get_chunks_list(
    limit: int = 50,
    offset: int = 0,
    source_id: Optional[str] = None,
) -> List[ChunkItem]:
    """Retrieve paginated knowledge chunks."""
    db = SessionLocal()
    try:
        stmt = select(KnowledgeChunk)
        if source_id:
            stmt = stmt.where(KnowledgeChunk.source_id == source_id)
        stmt = stmt.order_by(KnowledgeChunk.id.asc()).offset(offset).limit(limit)

        chunks = db.execute(stmt).scalars().all()
        return [
            ChunkItem(
                id=c.id,
                source_id=c.source_id,
                chunk_text=c.chunk_text,
                metadata_json=c.metadata_json,
            )
            for c in chunks
        ]
    finally:
        db.close()


def search_vector_chunks(
    query: str,
    limit: int = 5,
    source_id: Optional[str] = None,
) -> List[KnowledgeSearchResult]:
    """
    Search knowledge chunks using dense vector cosine similarity.
    Supports pgvector <=> operator with Python fallback for test environments.
    """
    query_vector = generate_single_embedding(query)
    db = SessionLocal()

    try:
        results = []
        try:
            # Native pgvector cosine distance
            cosine_dist = KnowledgeChunk.embedding.cosine_distance(query_vector)
            stmt = select(KnowledgeChunk, cosine_dist.label("dist")).where(
                KnowledgeChunk.embedding.isnot(None)
            )
            if source_id:
                stmt = stmt.where(KnowledgeChunk.source_id == source_id)

            stmt = stmt.order_by("dist").limit(limit)
            rows = db.execute(stmt).all()

            for chunk, dist in rows:
                score = round(max(0.0, 1.0 - float(dist)), 4) if dist is not None else 0.0
                results.append(
                    KnowledgeSearchResult(
                        id=chunk.id,
                        source_id=chunk.source_id,
                        chunk_text=chunk.chunk_text,
                        similarity_score=score,
                        metadata_json=chunk.metadata_json,
                    )
                )

        except Exception as pg_err:
            logger.warning(f"Native pgvector search failed ({pg_err}), using Python cosine similarity fallback.")
            # Fallback for environments where <=> is not directly supported
            stmt = select(KnowledgeChunk).where(KnowledgeChunk.embedding.isnot(None))
            if source_id:
                stmt = stmt.where(KnowledgeChunk.source_id == source_id)
            chunks = db.execute(stmt).scalars().all()

            if not chunks:
                return []

            q_vec = np.array(query_vector, dtype=np.float32)
            q_norm = np.linalg.norm(q_vec) or 1.0

            scored = []
            for c in chunks:
                if c.embedding:
                    c_vec = np.array(c.embedding, dtype=np.float32)
                    c_norm = np.linalg.norm(c_vec) or 1.0
                    sim = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
                    scored.append((c, sim))

            scored.sort(key=lambda x: x[1], reverse=True)
            for chunk, sim in scored[:limit]:
                results.append(
                    KnowledgeSearchResult(
                        id=chunk.id,
                        source_id=chunk.source_id,
                        chunk_text=chunk.chunk_text,
                        similarity_score=round(max(0.0, sim), 4),
                        metadata_json=chunk.metadata_json,
                    )
                )

        return results

    finally:
        db.close()


def seed_default_knowledge_base(max_chunks: Optional[int] = 50) -> SeedKnowledgeResponse:
    """
    Ingest AMR_KNOWLEDGE_BASE.md into knowledge_chunks table.
    Limits chunks if max_chunks is specified to respect API quotas while priming Neon.
    """
    start_time = time.time()
    kb_path = os.path.join(
        os.path.dirname(__file__), "..", "knowledge", "data_source", "AMR_KNOWLEDGE_BASE.md"
    )

    if not os.path.exists(kb_path):
        raise FileNotFoundError(f"Default knowledge base not found at {kb_path}")

    filename = "AMR_KNOWLEDGE_BASE.md"
    with open(kb_path, "rb") as f:
        # Read the file
        raw_bytes = f.read()

    # Structure-aware chunking
    all_chunks = chunk_document(filename, raw_bytes, target_size=1000)
    
    # If max_chunks is specified, take the first max_chunks
    chunks_to_embed = all_chunks[:max_chunks] if max_chunks else all_chunks

    chunk_texts = [text for text, _ in chunks_to_embed]
    embeddings = generate_batch_embeddings(chunk_texts, batch_size=25)

    db = SessionLocal()
    try:
        db.execute(delete(KnowledgeChunk).where(KnowledgeChunk.source_id == filename))
        new_objects = [
            KnowledgeChunk(
                source_id=filename,
                chunk_text=text,
                embedding=emb,
                metadata_json=meta,
            )
            for (text, meta), emb in zip(chunks_to_embed, embeddings)
        ]
        db.add_all(new_objects)
        db.commit()

        latency_ms = int((time.time() - start_time) * 1000)
        return SeedKnowledgeResponse(
            status="success",
            source_id=filename,
            chunks_created=len(new_objects),
            latency_ms=latency_ms,
        )
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
