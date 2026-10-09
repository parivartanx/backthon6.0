"""
Vector Embedding Service for AMR-Guard.

Generates 768-dimensional dense vector embeddings via OpenRouter
using 'openai/text-embedding-3-small' with dimensions=768 to match
PostgreSQL / Neon 'vector(768)' columns in knowledge_chunks.
"""

import time
import logging
from typing import List, Optional
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger("amr_guard.embeddings")

DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small"
EMBEDDING_DIMENSIONS = 768
BATCH_SIZE = 25


def get_embedding_client() -> OpenAI:
    """Initialize OpenAI client configured for OpenRouter."""
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
    )


def generate_single_embedding(text: str) -> List[float]:
    """Generate 768-dimensional embedding for a single text string."""
    embeddings = generate_batch_embeddings([text])
    if not embeddings:
        raise RuntimeError("Failed to generate embedding for query.")
    return embeddings[0]


def generate_batch_embeddings(
    texts: List[str],
    batch_size: int = BATCH_SIZE,
    model: str = DEFAULT_EMBEDDING_MODEL,
    dimensions: int = EMBEDDING_DIMENSIONS,
    max_retries: int = 3,
) -> List[List[float]]:
    """
    Generate 768-d embeddings for a list of texts in batches with retry logic.
    """
    if not texts:
        return []

    client = get_embedding_client()
    all_embeddings: List[List[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        # Clean and clamp text if excessively long
        cleaned_batch = [t[:8000] if len(t) > 8000 else t for t in batch]

        success = False
        last_exception = None

        for attempt in range(1, max_retries + 1):
            try:
                response = client.embeddings.create(
                    model=model,
                    input=cleaned_batch,
                    dimensions=dimensions,
                )
                
                # Sort items by index to guarantee correct ordering
                sorted_data = sorted(response.data, key=lambda x: x.index)
                batch_vectors = [item.embedding for item in sorted_data]
                
                # Validate dimensions
                for v in batch_vectors:
                    if len(v) != dimensions:
                        raise ValueError(f"Expected embedding dim {dimensions}, got {len(v)}")

                all_embeddings.extend(batch_vectors)
                success = True
                break

            except Exception as e:
                last_exception = e
                logger.warning(
                    f"Embedding batch [{i}:{i+len(batch)}] attempt {attempt} failed: {e}. Retrying..."
                )
                time.sleep(1.0 * attempt)

        if not success:
            logger.error(f"Failed to generate embeddings after {max_retries} attempts: {last_exception}")
            raise RuntimeError(f"Embedding generation failed: {last_exception}")

    return all_embeddings
