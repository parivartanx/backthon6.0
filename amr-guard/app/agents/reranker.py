"""
Reciprocal Rank Fusion (RRF) Reranking Engine for AMR-Guard.

RRF is an algorithmic hybrid re-ranking method that combines results from
multiple retrieval systems (e.g., dense vector search and sparse BM25 lexical search)
without needing a separate heavy neural cross-encoder or external API calls.

Formula:
    RRF_Score(d) = sum_{m in M} [ 1 / (k + r_m(d)) ]

Where:
    - M is the set of retrieval models (e.g. pgvector semantic search and BM25).
    - r_m(d) is the 1-based rank position of document d in the retrieval list m.
    - k is a ranking constant (default = 60, empirically proven in information retrieval).
"""
from typing import TypeVar, Hashable, Sequence, Optional
import re

T = TypeVar("T", bound=Hashable)

DEFAULT_RRF_K: int = 60


def reciprocal_rank_fusion(
    ranked_lists: Sequence[Sequence[T]],
    k: int = DEFAULT_RRF_K,
    top_n: Optional[int] = None,
) -> list[tuple[T, float]]:
    """
    Combines multiple ranked lists into a single consensus ranking using
    Reciprocal Rank Fusion (RRF).

    Args:
        ranked_lists: A list of ranked candidate sequences (from highest to lowest relevance).
        k: Smoothing constant to control the impact of high-ranking items (default: 60).
        top_n: Maximum number of fused results to return. If None, returns all unique items.

    Returns:
        List of tuples (item, rrf_score) sorted in descending order of score.
    """
    scores: dict[T, float] = {}

    for ranked_list in ranked_lists:
        for rank_zero_indexed, item in enumerate(ranked_list):
            rank_1_indexed = rank_zero_indexed + 1
            reciprocal_score = 1.0 / (k + rank_1_indexed)
            scores[item] = scores.get(item, 0.0) + reciprocal_score

    # Sort items descending by score, tie-breaking by original appearance / item identity
    sorted_ranked = sorted(scores.items(), key=lambda entry: entry[1], reverse=True)

    if top_n is not None and top_n > 0:
        return sorted_ranked[:top_n]

    return sorted_ranked


def tokenize_text(text: str) -> list[str]:
    """Simple alphanumeric tokenizer for lexical BM25 matching."""
    return re.findall(r"\w+", text.lower())


def rank_with_bm25(corpus: list[str], query: str, top_k: int = 10) -> list[str]:
    """
    Rank a list of document chunks using BM25Okapi scoring.
    
    Args:
        corpus: List of text documents.
        query: Search query text.
        top_k: Number of top documents to return.
        
    Returns:
        Top ranked documents from the corpus based on BM25 scores.
    """
    if not corpus:
        return []

    from rank_bm25 import BM25Okapi

    tokenized_corpus = [tokenize_text(doc) for doc in corpus]
    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = tokenize_text(query)

    if not tokenized_query:
        return corpus[:top_k]

    scores = bm25.get_scores(tokenized_query)
    # Pair documents with their scores and sort descending
    doc_scores = list(zip(corpus, scores))
    doc_scores.sort(key=lambda x: x[1], reverse=True)

    return [doc for doc, score in doc_scores if score > 0][:top_k]
