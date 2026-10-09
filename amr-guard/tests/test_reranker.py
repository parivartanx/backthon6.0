"""
Unit tests for the Reciprocal Rank Fusion (RRF) reranking system in AMR-Guard.
"""
import pytest
from app.agents.reranker import reciprocal_rank_fusion, rank_with_bm25, tokenize_text
from app.agents.tools import search_amr_knowledge


def test_tokenize_text():
    tokens = tokenize_text("Nitrofurantoin 100mg BID for 5-days!")
    assert "nitrofurantoin" in tokens
    assert "100mg" in tokens
    assert "bid" in tokens
    assert "5" in tokens
    assert "days" in tokens


def test_rrf_scoring_basic():
    """Verify standard RRF calculation: 1 / (60 + rank)."""
    list_a = ["doc1", "doc2", "doc3"]
    list_b = ["doc1", "doc3", "doc2"]

    # doc1 is rank 1 in both: score = 1/(60+1) + 1/(60+1) = 2/61 ≈ 0.032787
    results = reciprocal_rank_fusion([list_a, list_b], k=60)
    top_doc, top_score = results[0]

    assert top_doc == "doc1"
    expected_doc1_score = (1.0 / 61.0) + (1.0 / 61.0)
    assert pytest.approx(top_score, rel=1e-4) == expected_doc1_score


def test_rrf_consensus_boost():
    """An item appearing prominently in both lists should beat an item only in one list."""
    list_dense = ["docA", "docB", "docC"]
    list_sparse = ["docB", "docD", "docA"]

    # docA: rank 1 (dense), rank 3 (sparse) -> 1/61 + 1/63 ≈ 0.01639 + 0.01587 = 0.03226
    # docB: rank 2 (dense), rank 1 (sparse) -> 1/62 + 1/61 ≈ 0.01613 + 0.01639 = 0.03252 -> docB wins!
    results = reciprocal_rank_fusion([list_dense, list_sparse], k=60)
    
    ranked_doc_names = [doc for doc, _ in results]
    assert ranked_doc_names[0] == "docB"
    assert ranked_doc_names[1] == "docA"


def test_rrf_top_n_truncation():
    """Verify that top_n limits the output size."""
    list_a = [f"doc_{i}" for i in range(20)]
    results = reciprocal_rank_fusion([list_a], top_n=5)
    assert len(results) == 5
    assert results[0][0] == "doc_0"


def test_bm25_ranking_accuracy():
    """Verify that BM25 retrieves the most relevant clinical chunk for a specific query."""
    corpus = [
        "Asthma management and bronchodilators.",
        "Ciprofloxacin resistance in urinary tract infections (UTI).",
        "Hypertension protocols and ACE inhibitors."
    ]
    query = "UTI ciprofloxacin"
    ranked = rank_with_bm25(corpus, query, top_k=2)

    assert len(ranked) >= 1
    assert "Ciprofloxacin resistance in urinary tract infections" in ranked[0]


def test_search_amr_knowledge_rrf_integration():
    """Verify end-to-end knowledge search with RRF scores in output."""
    query = "pediatric ciprofloxacin cartilage"
    result = search_amr_knowledge(query, limit=3)

    assert "[Reranked #1 | RRF Score:" in result
    assert "cartilage" in result.lower() or "pediatric" in result.lower()
