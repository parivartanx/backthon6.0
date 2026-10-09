"""
Script to seed authorized, verified clinical case studies into Neon PostgreSQL knowledge_chunks
with 768-dimensional dense vector embeddings for RAG retrieval and few-shot reasoning.
"""
import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.knowledge_service import ingest_file_content, search_vector_chunks
from app.db.session import SessionLocal
from app.db.models import KnowledgeChunk

def main():
    print("=" * 70)
    print("AMR-GUARD: SEEDING VERIFIED CLINICAL CASE STUDIES INTO PGVECTOR")
    print("=" * 70)

    kb_path = os.path.join(
        os.path.dirname(__file__), "..", "app", "knowledge", "data_source", "CLINICAL_CASE_STUDIES.md"
    )

    if not os.path.exists(kb_path):
        print(f"Error: {kb_path} not found.")
        sys.exit(1)

    with open(kb_path, "rb") as f:
        raw_bytes = f.read()

    print(f"Read {len(raw_bytes)} bytes from CLINICAL_CASE_STUDIES.md.")
    print("Parsing, chunking, generating 768-d OpenRouter embeddings, and upserting into Neon...")
    
    start_t = time.time()
    res = ingest_file_content(
        filename="CLINICAL_CASE_STUDIES.md",
        raw_bytes=raw_bytes,
        target_chunk_size=1200,
    )
    elapsed = time.time() - start_t

    print(f"\n[OK] Ingestion Status: {res.status}")
    print(f"  - Source ID: {res.source_id}")
    print(f"  - Chunks Created & Embedded: {res.chunks_created}")
    print(f"  - Latency: {elapsed:.2f}s ({res.latency_ms}ms reported)")

    # Verify directly from Database
    db = SessionLocal()
    try:
        count = db.query(KnowledgeChunk).filter(KnowledgeChunk.source_id == "CLINICAL_CASE_STUDIES.md").count()
        total_chunks = db.query(KnowledgeChunk).count()
        print(f"  - Case Study Chunks in DB: {count}")
        print(f"  - Total Knowledge Chunks in DB: {total_chunks}")
    finally:
        db.close()

    # Benchmark test semantic search retrieval
    print("\n" + "-" * 70)
    print("TESTING HYBRID VECTOR RETRIEVAL ON NEWLY SEEDED CASE STUDIES:")
    print("-" * 70)

    test_queries = [
        "ESBL E. coli recurrent UTI in CKD patient creatinine 2.1",
        "Pediatric pneumonia overprescribed cefixime azithromycin amoxicillin",
        "Carbapenem resistant Klebsiella NDM-1 ceftazidime avibactam aztreonam",
        "Pregnancy pyelonephritis avoid ciprofloxacin fluoroquinolones",
    ]

    for q in test_queries:
        print(f"\nQuery: '{q}'")
        search_res = search_vector_chunks(query=q, limit=2)
        if search_res:
            top = search_res[0]
            first_line = top.chunk_text.strip().split("\n")[0]
            print(f"  -> Top Match [Score: {top.similarity_score:.4f}]: {first_line[:90]}...")
        else:
            print("  -> No match returned.")

    print("\n" + "=" * 70)
    print("SEEDING COMPLETE & VERIFIED")
    print("=" * 70)

if __name__ == "__main__":
    main()
