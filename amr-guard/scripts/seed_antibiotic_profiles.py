"""
Script to seed the 180 FDA/WHO authorized antibiotic safety profiles into Neon PostgreSQL
knowledge_chunks with 768-dimensional dense vector embeddings.
"""
import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.knowledge_service import ingest_file_content, search_vector_chunks
from app.db.session import SessionLocal
from app.db.models import KnowledgeChunk

def main():
    print("=" * 75)
    print("AMR-GUARD: SEEDING 180 ANTIBIOTIC SAFETY PROFILES INTO PGVECTOR")
    print("=" * 75)

    md_path = os.path.join(
        os.path.dirname(__file__), "..", "app", "knowledge", "data_source", "ANTIBIOTIC_SAFETY_PROFILES_FDA.md"
    )

    if not os.path.exists(md_path):
        print(f"Error: {md_path} not found.")
        sys.exit(1)

    with open(md_path, "rb") as f:
        raw_bytes = f.read()

    print(f"Read {len(raw_bytes)} bytes ({len(raw_bytes)/1024:.1f} KB) from ANTIBIOTIC_SAFETY_PROFILES_FDA.md.")
    print("Chunking, generating 768-d OpenRouter embeddings, and upserting into Neon...")

    start_t = time.time()
    res = ingest_file_content(
        filename="ANTIBIOTIC_SAFETY_PROFILES_FDA.md",
        raw_bytes=raw_bytes,
        target_chunk_size=1200,
    )
    elapsed = time.time() - start_t

    print(f"\n[OK] Ingestion Status: {res.status}")
    print(f"  - Source ID: {res.source_id}")
    print(f"  - Chunks Created & Embedded: {res.chunks_created}")
    print(f"  - Latency: {elapsed:.2f}s ({res.latency_ms}ms reported)")

    # Inspect total chunks in database
    db = SessionLocal()
    try:
        total_chunks = db.query(KnowledgeChunk).count()
        print(f"\n  - Total Knowledge Chunks in Neon DB: {total_chunks}")
        
        # Summary by source
        from sqlalchemy import func
        breakdown = db.query(KnowledgeChunk.source_id, func.count(KnowledgeChunk.id)).group_by(KnowledgeChunk.source_id).all()
        print("  - Breakdown by source_id:")
        for sid, cnt in breakdown:
            print(f"      * {sid or 'Unknown'}: {cnt} chunks")
    finally:
        db.close()

    # Test semantic vector searches across high-risk clinical safety scenarios
    print("\n" + "-" * 75)
    print("TESTING CLINICAL SAFETY RETRIEVAL BENCHMARKS ON NEWLY SEEDED DATA:")
    print("-" * 75)

    benchmarks = [
        "Antibiotic causing Achilles tendon rupture and peripheral neuropathy boxed warning",
        "Irreversible cochlear ototoxicity and acute tubular necrosis nephrotoxicity",
        "Contraindicated in pneumonia because pulmonary surfactant inactivates it rhabdomyolysis",
        "Disulfiram like ethanol reaction with alcohol due to NMTT side chain",
        "Veterinary exclusive antibiotic strictly prohibited in humans",
        "Gray baby syndrome and irreversible fatal aplastic anemia boxed warning",
        "Permanent tooth discoloration and enamel hypoplasia in pediatric patients",
    ]

    for q in benchmarks:
        print(f"\nQuery: '{q}'")
        search_res = search_vector_chunks(query=q, limit=2)
        if search_res:
            top = search_res[0]
            first_line = top.chunk_text.strip().split("\n")[0]
            print(f"  -> Top Match [Score: {top.similarity_score:.4f}]: {first_line[:90]}...")
        else:
            print("  -> No match returned.")

    print("\n" + "=" * 75)
    print("SEEDING AND VALIDATION COMPLETE")
    print("=" * 75)

if __name__ == "__main__":
    main()
