import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import SessionLocal
from app.db.models import KnowledgeChunk
from app.core.config import settings

def chunk_markdown(content: str, max_chars: int = 1000) -> list[str]:
    """Simple stub chunker. In production, use a proper Markdown splitter."""
    chunks = []
    current_chunk = ""
    for paragraph in content.split("\n\n"):
        if len(current_chunk) + len(paragraph) > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = paragraph
        else:
            current_chunk += "\n\n" + paragraph
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def main():
    kb_path = os.path.join(os.path.dirname(__file__), "..", "app", "knowledge", "data_source", "AMR_KNOWLEDGE_BASE.md")
    if not os.path.exists(kb_path):
        print(f"Knowledge base not found at {kb_path}")
        return

    print("Reading AMR Knowledge Base...")
    with open(kb_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    print("Chunking content...")
    chunks = chunk_markdown(content)
    print(f"Generated {len(chunks)} chunks.")

    # client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    db = SessionLocal()
    
    print("Generating embeddings and saving to DB...")
    
    for i, chunk_text in enumerate(chunks):
        if not chunk_text.strip():
            continue
            
        try:
            # --- STUB FOR EMBEDDINGS ---
            # In production:
            # response = client.models.embed_content(
            #     model="text-embedding-004",
            #     contents=chunk_text
            # )
            # embedding = response.embeddings[0].values
            
            embedding = [0.0] * 768 # Dummy embedding for pgvector
            
            kc = KnowledgeChunk(
                source_id=f"KB_CHUNK_{i}",
                chunk_text=chunk_text,
                embedding=embedding,
                metadata_json={"source": "AMR_KNOWLEDGE_BASE.md", "index": i}
            )
            db.add(kc)
            
            if i % 1000 == 0:
                print(f"Processed {i} chunks...")
                
        except Exception as e:
            print(f"Error on chunk {i}: {e}")
            break
            
    db.commit()
    db.close()
    print("Knowledge ingestion complete! Vector DB is primed.")

if __name__ == "__main__":
    main()
