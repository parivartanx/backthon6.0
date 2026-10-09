import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv()

from sqlalchemy import make_url
from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import Settings
from app.core.config import settings

def main():
    kb_path = os.path.join(os.path.dirname(__file__), "..", "app", "knowledge", "data_source")
    
    # Configure Embedding to route through OpenRouter using the OpenAI interface
    Settings.embed_model = OpenAIEmbedding(
        model="openai/text-embedding-3-small", 
        api_key=settings.OPENROUTER_API_KEY,
        api_base="https://openrouter.ai/api/v1"
    )
    
    print(f"Reading documents from {kb_path}...")
    documents = SimpleDirectoryReader(input_dir=kb_path, required_exts=[".md"]).load_data()
    print(f"Loaded {len(documents)} document chunks.")

    # Convert the sqlalchemy URL into a format psycopg2 expects
    url = make_url(settings.DATABASE_URL)
    
    print("Connecting to Vector Store...")
    vector_store = PGVectorStore.from_params(
        database=url.database,
        host=url.host,
        password=url.password,
        port=url.port,
        user=url.username,
        table_name="amr_knowledge_index",
        embed_dim=1536, # Standard for OpenAI text-embedding-3-small
    )
    
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    print("Ingesting and generating embeddings...")
    index = VectorStoreIndex.from_documents(
        documents, storage_context=storage_context, show_progress=True
    )
    print("Knowledge ingestion complete! LlamaIndex PGVectorStore is primed.")

if __name__ == "__main__":
    main()
