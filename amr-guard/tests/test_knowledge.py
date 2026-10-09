import os
import sys
import io
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pypdf import PdfWriter
from app.services.chunking_service import chunk_document, chunk_markdown, chunk_plain_text, chunk_pdf
from app.services.embedding_service import generate_single_embedding, generate_batch_embeddings
from app.services.knowledge_service import (
    ingest_file_content,
    get_knowledge_stats,
    get_chunks_list,
    search_vector_chunks,
)


def create_sample_pdf_bytes() -> bytes:
    """Generate a valid in-memory PDF with sample clinical guidelines."""
    # Create a basic PDF using PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    stream = io.BytesIO()
    writer.write(stream)
    return stream.getvalue()


def test_markdown_chunking_with_breadcrumbs():
    sample_md = """# ICMR Guidelines
## Respiratory Tract Infections
### Acute Bronchitis
Acute bronchitis is overwhelmingly of viral etiology (e.g. influenza, rhinovirus).
Routine antibacterial therapy is not indicated and confers no demonstrable clinical benefit.

| Patient Group | Recommended Therapy | Duration |
|---|---|---|
| Uncomplicated | Symptomatic + Paracetamol | 5 days |
| Severe Wheeze | Inhaled Salbutamol | As needed |
"""
    chunks = chunk_document("test_respiratory.md", sample_md.encode("utf-8"), target_size=500)
    assert len(chunks) >= 1
    chunk_text, meta = chunks[0]

    # Verify context breadcrumb is attached
    assert "[Context: test_respiratory.md > ICMR Guidelines > Respiratory Tract Infections > Acute Bronchitis]" in chunk_text
    # Verify table integrity
    assert "| Patient Group | Recommended Therapy | Duration |" in chunk_text
    assert meta["source_id"] == "test_respiratory.md"
    assert meta["file_type"] == "markdown"
    assert meta["h1"] == "ICMR Guidelines"
    assert meta["h2"] == "Respiratory Tract Infections"
    assert meta["h3"] == "Acute Bronchitis"


def test_plain_text_chunking():
    sample_txt = (
        "Urinary Tract Infection empiric management guidelines. "
        "First-line treatment for uncomplicated acute cystitis is Nitrofurantoin 100mg twice daily for 5 days. "
        "Fosfomycin trometamol 3g single dose is an approved alternative agent. "
        "Avoid empirical Ciprofloxacin due to high community resistance exceeding 75% in Indian isolates."
    )
    chunks = chunk_document("uti_guideline.txt", sample_txt.encode("utf-8"), target_size=200)
    assert len(chunks) >= 1
    chunk_text, meta = chunks[0]

    assert "[Context: uti_guideline.txt]" in chunk_text
    assert meta["file_type"] == "txt"
    assert meta["source_id"] == "uti_guideline.txt"


def test_768_dimension_embeddings():
    vec = generate_single_embedding("ICMR Antimicrobial Stewardship Guidelines")
    assert len(vec) == 768
    assert all(isinstance(val, float) for val in vec)


def test_ingest_and_vector_search_end_to_end():
    doc_name = "test_pediatric_guidelines.md"
    doc_content = """# ICMR Pediatric Clinical Guidelines
## Musculoskeletal and Dental Safety
### Contraindicated Antimicrobial Classes
Fluoroquinolones (Ciprofloxacin, Levofloxacin, Ofloxacin) are contraindicated in pediatric patients under 18 years.
They cause irreversible articular cartilage arthropathy in weight-bearing joints.

Tetracyclines (Doxycycline) are contraindicated under 8 years due to permanent tooth enamel hypoplasia and discoloration.
"""
    # 1. Ingest document
    response = ingest_file_content(
        filename=doc_name,
        raw_bytes=doc_content.encode("utf-8"),
        target_chunk_size=600,
    )

    assert response.status == "success"
    assert response.filename == doc_name
    assert response.chunks_created >= 1

    # 2. Check stats
    stats = get_knowledge_stats()
    assert stats.total_chunks >= 1
    assert doc_name in stats.sources

    # 3. Perform vector similarity search
    results = search_vector_chunks(
        query="pediatric contraindications articular cartilage arthropathy",
        limit=3,
        source_id=doc_name,
    )

    assert len(results) >= 1
    top_result = results[0]
    assert "Fluoroquinolones" in top_result.chunk_text or "cartilage" in top_result.chunk_text
    assert top_result.similarity_score > 0.0
