"""
Structure-Aware Knowledge Chunking Engine for AMR-Guard.

Provides context-preserving chunking for PDF, TXT, and Markdown files:
1. Markdown: Parses heading hierarchies (#, ##, ###), table structures, and paragraph blocks.
2. PDF: Extracts page-level and section blocks using pypdf.
3. Plain Text: Splits on natural paragraph and sentence boundaries.
4. Context Enrichment: Prepends hierarchical document breadcrumbs to every chunk
   so vector retrieval never loses condition/syndrome context.
"""

import io
import re
from typing import List, Tuple, Dict, Any, Optional
from pypdf import PdfReader


def clean_text(text: str) -> str:
    """Normalize whitespace while preserving paragraphs."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse 3 or more newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_sentences_safely(text: str) -> List[str]:
    """
    Split text into complete sentences, protecting clinical abbreviations
    like Tab., Cap., e.g., i.e., mg., mL., Dr.
    """
    # Protect common medical abbreviations with placeholders
    protected = text
    abbrevs = {
        "e.g.": "__EG__",
        "i.e.": "__IE__",
        "Tab.": "__TAB__",
        "Cap.": "__CAP__",
        "Inj.": "__INJ__",
        "Dr.": "__DR__",
        "vs.": "__VS__",
        "approx.": "__APPROX__",
        "et al.": "__ETAL__",
        "mg.": "__MG__",
        "mL.": "__ML__",
    }
    for orig, rep in abbrevs.items():
        protected = protected.replace(orig, rep)

    # Split on sentence terminals followed by whitespace and capital/quote/bullet
    raw_sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'•\-\*])", protected)

    sentences = []
    for s in raw_sentences:
        s_clean = s
        for orig, rep in abbrevs.items():
            s_clean = s_clean.replace(rep, orig)
        s_clean = s_clean.strip()
        if s_clean:
            sentences.append(s_clean)

    return sentences if sentences else [text.strip()]


def pack_sentences_into_chunks(
    sentences: List[str],
    target_size: int = 1000,
    min_size: int = 200,
) -> List[str]:
    """
    Group sentences into chunks close to target_size without breaking sentences.
    """
    chunks = []
    current_sentences = []
    current_length = 0

    for sent in sentences:
        sent_len = len(sent)
        if current_length + sent_len > target_size and current_sentences:
            chunks.append(" ".join(current_sentences))
            current_sentences = [sent]
            current_length = sent_len
        else:
            current_sentences.append(sent)
            current_length += sent_len + 1

    if current_sentences:
        last_chunk = " ".join(current_sentences)
        # If last chunk is very small and there is a preceding chunk, combine them if not exceeding 1.5x target
        if chunks and len(last_chunk) < min_size and (len(chunks[-1]) + len(last_chunk) < int(target_size * 1.5)):
            chunks[-1] = chunks[-1] + " " + last_chunk
        else:
            chunks.append(last_chunk)

    return chunks


def chunk_markdown(
    content: str,
    filename: str,
    target_size: int = 1000
) -> List[Tuple[str, Dict[str, Any]]]:
    """
    Chunk markdown documents preserving heading hierarchies (#, ##, ###),
    tables, and bullet lists with breadcrumb context enrichment.
    """
    content = clean_text(content)
    lines = content.split("\n")

    h1 = ""
    h2 = ""
    h3 = ""

    sections: List[Dict[str, Any]] = []
    current_section_lines: List[str] = []
    current_breadcrumb = filename

    def flush_section():
        nonlocal current_section_lines, current_breadcrumb
        if current_section_lines:
            sec_text = "\n".join(current_section_lines).strip()
            if sec_text:
                sections.append({
                    "breadcrumb": current_breadcrumb,
                    "text": sec_text,
                    "h1": h1,
                    "h2": h2,
                    "h3": h3,
                })
            current_section_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# ") and not stripped.startswith("## "):
            flush_section()
            h1 = stripped.lstrip("#").strip()
            h2 = ""
            h3 = ""
            current_breadcrumb = f"{filename} > {h1}"
        elif stripped.startswith("## ") and not stripped.startswith("### "):
            flush_section()
            h2 = stripped.lstrip("#").strip()
            h3 = ""
            current_breadcrumb = f"{filename} > {h1} > {h2}" if h1 else f"{filename} > {h2}"
        elif stripped.startswith("### ") and not stripped.startswith("#### "):
            flush_section()
            h3 = stripped.lstrip("#").strip()
            parts = [p for p in [filename, h1, h2, h3] if p]
            current_breadcrumb = " > ".join(parts)
        else:
            current_section_lines.append(line)

    flush_section()

    chunks_with_meta: List[Tuple[str, Dict[str, Any]]] = []

    for sec in sections:
        breadcrumb = sec["breadcrumb"]
        sec_text = sec["text"]

        # Check if section text contains markdown tables (keep tables together)
        paragraphs = re.split(r"\n\s*\n", sec_text)
        sub_blocks = []

        i = 0
        while i < len(paragraphs):
            p = paragraphs[i].strip()
            if not p:
                i += 1
                continue
            
            # Check if this paragraph is a markdown table
            if "|" in p and "\n" in p and any(cell_div in p for cell_div in ["|---", "|:---", "| ---"]):
                # Keep table as a discrete block
                sub_blocks.append(p)
                i += 1
            else:
                # Regular paragraph: split into sentences if large
                if len(p) > target_size:
                    sents = split_sentences_safely(p)
                    packed = pack_sentences_into_chunks(sents, target_size=target_size)
                    sub_blocks.extend(packed)
                else:
                    sub_blocks.append(p)
                i += 1

        # Group sub_blocks up to target_size
        current_block = []
        current_len = 0

        for block in sub_blocks:
            if current_len + len(block) > target_size and current_block:
                body = "\n\n".join(current_block)
                enriched_text = f"[Context: {breadcrumb}]\n\n{body}"
                chunks_with_meta.append((
                    enriched_text,
                    {
                        "source_id": filename,
                        "file_type": "markdown",
                        "section_breadcrumb": breadcrumb,
                        "h1": sec["h1"],
                        "h2": sec["h2"],
                        "h3": sec["h3"],
                        "char_count": len(enriched_text),
                    }
                ))
                current_block = [block]
                current_len = len(block)
            else:
                current_block.append(block)
                current_len += len(block)

        if current_block:
            body = "\n\n".join(current_block)
            enriched_text = f"[Context: {breadcrumb}]\n\n{body}"
            chunks_with_meta.append((
                enriched_text,
                {
                    "source_id": filename,
                    "file_type": "markdown",
                    "section_breadcrumb": breadcrumb,
                    "h1": sec["h1"],
                    "h2": sec["h2"],
                    "h3": sec["h3"],
                    "char_count": len(enriched_text),
                }
            ))

    return chunks_with_meta


def chunk_pdf(
    file_bytes: bytes,
    filename: str,
    target_size: int = 1000
) -> List[Tuple[str, Dict[str, Any]]]:
    """
    Extract and structure-aware chunking for PDF documents with page tracking.
    """
    reader = PdfReader(io.BytesIO(file_bytes))
    chunks_with_meta: List[Tuple[str, Dict[str, Any]]] = []

    for page_num, page in enumerate(reader.pages, start=1):
        raw_page_text = page.extract_text() or ""
        cleaned = clean_text(raw_page_text)
        if not cleaned:
            continue

        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", cleaned) if p.strip()]
        
        # Split large paragraphs into sentences
        expanded_blocks = []
        for p in paragraphs:
            if len(p) > target_size:
                sents = split_sentences_safely(p)
                packed = pack_sentences_into_chunks(sents, target_size=target_size)
                expanded_blocks.extend(packed)
            else:
                expanded_blocks.append(p)

        # Pack page blocks
        current_block = []
        current_len = 0

        for block in expanded_blocks:
            if current_len + len(block) > target_size and current_block:
                body = "\n\n".join(current_block)
                breadcrumb = f"{filename} > Page {page_num}"
                enriched_text = f"[Context: {breadcrumb}]\n\n{body}"
                chunks_with_meta.append((
                    enriched_text,
                    {
                        "source_id": filename,
                        "file_type": "pdf",
                        "page_number": page_num,
                        "section_breadcrumb": breadcrumb,
                        "char_count": len(enriched_text),
                    }
                ))
                current_block = [block]
                current_len = len(block)
            else:
                current_block.append(block)
                current_len += len(block)

        if current_block:
            body = "\n\n".join(current_block)
            breadcrumb = f"{filename} > Page {page_num}"
            enriched_text = f"[Context: {breadcrumb}]\n\n{body}"
            chunks_with_meta.append((
                enriched_text,
                {
                    "source_id": filename,
                    "file_type": "pdf",
                    "page_number": page_num,
                    "section_breadcrumb": breadcrumb,
                    "char_count": len(enriched_text),
                }
            ))

    return chunks_with_meta


def chunk_plain_text(
    content: str,
    filename: str,
    target_size: int = 1000
) -> List[Tuple[str, Dict[str, Any]]]:
    """
    Structure-aware chunking for plain text files preserving paragraphs and sentences.
    """
    content = clean_text(content)
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]

    expanded_blocks = []
    for p in paragraphs:
        if len(p) > target_size:
            sents = split_sentences_safely(p)
            packed = pack_sentences_into_chunks(sents, target_size=target_size)
            expanded_blocks.extend(packed)
        else:
            expanded_blocks.append(p)

    chunks_with_meta: List[Tuple[str, Dict[str, Any]]] = []
    current_block = []
    current_len = 0

    for block in expanded_blocks:
        if current_len + len(block) > target_size and current_block:
            body = "\n\n".join(current_block)
            breadcrumb = filename
            enriched_text = f"[Context: {breadcrumb}]\n\n{body}"
            chunks_with_meta.append((
                enriched_text,
                {
                    "source_id": filename,
                    "file_type": "txt",
                    "section_breadcrumb": breadcrumb,
                    "char_count": len(enriched_text),
                }
            ))
            current_block = [block]
            current_len = len(block)
        else:
            current_block.append(block)
            current_len += len(block)

    if current_block:
        body = "\n\n".join(current_block)
        breadcrumb = filename
        enriched_text = f"[Context: {breadcrumb}]\n\n{body}"
        chunks_with_meta.append((
            enriched_text,
            {
                "source_id": filename,
                "file_type": "txt",
                "section_breadcrumb": breadcrumb,
                "char_count": len(enriched_text),
            }
        ))

    return chunks_with_meta


def chunk_document(
    filename: str,
    raw_bytes: bytes,
    target_size: int = 1000
) -> List[Tuple[str, Dict[str, Any]]]:
    """
    Entry point for document chunking. Detects format (.pdf, .md, .txt) and applies
    the appropriate structure-aware chunker.
    """
    ext = filename.lower().split(".")[-1] if "." in filename else "txt"

    if ext == "pdf":
        raw_chunks = chunk_pdf(raw_bytes, filename, target_size=target_size)
    elif ext in ["md", "markdown"]:
        text_content = raw_bytes.decode("utf-8", errors="replace")
        raw_chunks = chunk_markdown(text_content, filename, target_size=target_size)
    else:
        text_content = raw_bytes.decode("utf-8", errors="replace")
        raw_chunks = chunk_plain_text(text_content, filename, target_size=target_size)

    # Attach chunk indices and total counts
    total = len(raw_chunks)
    final_chunks = []
    for idx, (text, meta) in enumerate(raw_chunks, start=1):
        meta["chunk_index"] = idx
        meta["total_chunks"] = total
        final_chunks.append((text, meta))

    return final_chunks
