"""
Clinical knowledge retrieval tools for AMR-Guard agent orchestrator.
"""
from typing import Optional
from app.agents.reranker import reciprocal_rank_fusion, rank_with_bm25

# Curated reference guideline chunks for outpatient antimicrobial stewardship
CLINICAL_KNOWLEDGE_CORPUS = [
    "ICMR STG Respiratory: Uncomplicated Community-Acquired Pneumonia (CAP) first line therapy is Amoxicillin oral for 5 days. Fluoroquinolones (Levofloxacin/Moxifloxacin) are strictly reserved for severe cases or documented beta-lactam anaphylaxis.",
    "ICMR STG Pediatric: Fluoroquinolones and Tetracyclines are contraindicated in patients under 18 years due to irreversible articular cartilage damage and permanent tooth enamel hypoplasia respectively.",
    "ICMR-AMRSN Surveillance: Over 75% of uropathogenic E. coli isolates in India exhibit high-level resistance to Fluoroquinolones (Ciprofloxacin, Norfloxacin, Ofloxacin). Do not use empiric Ciprofloxacin for uncomplicated UTIs.",
    "ICMR STG Urological: First-line empiric treatment for uncomplicated acute cystitis in adult females is Nitrofurantoin 100mg BID for 5 days or single-dose Fosfomycin 3g oral sachet.",
    "Beers Criteria / Renal Safety: Nitrofurantoin is contraindicated in geriatric patients aged 65 and above or with eGFR < 30 mL/min due to inadequate urinary clearance and high risk of peripheral neuropathy and pulmonary toxicity.",
    "WHO AWaRe Framework (2023): Watch group antibiotics (e.g. Cefixime, Azithromycin, Levofloxacin) carry higher resistance potential and should not be used as empiric first-line when Access group agents are effective.",
    "WHO AWaRe Reserve Group: Reserve group antibiotics (Colistin, Meropenem, Linezolid) must be preserved for confirmed multi-drug resistant pathogens and require infectious disease specialist consultation and microbiological culture justification.",
    "ICMR STG Indication: Acute bronchitis, common cold, non-streptococcal pharyngitis, and acute watery diarrhea are primarily self-limiting viral etiologies. Antibiotics provide zero clinical benefit and are not indicated.",
    "DCGI & ICMR Regulatory Directive: Fixed-Dose Combinations (FDCs) of dual broad-spectrum antimicrobials (e.g. Ofloxacin + Ornidazole, Cefixime + Azithromycin) are irrational, accelerate multi-drug resistance, and are banned from outpatient empiric prescription.",
]


def search_amr_knowledge(query: str, limit: int = 5) -> str:
    """
    Search the AMR Knowledge Base using a hybrid retrieval pipeline with
    Reciprocal Rank Fusion (RRF) re-ranking.
    
    Workflow:
    1. Sparse retrieval: BM25 lexical ranking across guideline corpus.
    2. Dense retrieval: Semantic vector search simulation / pgvector ranking.
    3. Re-ranking: Reciprocal Rank Fusion (RRF) combining dense & sparse ranks.
    4. Synthesis: Returns top-N re-ranked clinical knowledge chunks.
    
    Args:
        query: The clinical scenario, drug name, or condition to search for.
        limit: Maximum number of re-ranked chunks to return.
        
    Returns:
        A string containing the concatenated top re-ranked knowledge chunks with RRF scores.
    """
    # 1. Sparse Lexical Search (BM25)
    sparse_ranked = rank_with_bm25(CLINICAL_KNOWLEDGE_CORPUS, query, top_k=len(CLINICAL_KNOWLEDGE_CORPUS))

    # 2. Dense Semantic Search (Simulated / pgvector matching by keyword/concept overlap)
    # In a full deployment, this connects to pgvector via LlamaIndex.
    query_lower = query.lower()
    dense_ranked = [
        chunk for chunk in CLINICAL_KNOWLEDGE_CORPUS
        if any(term in chunk.lower() for term in query_lower.split())
    ]
    # Ensure all corpus items are present in fallback if query doesn't match directly
    if not dense_ranked:
        dense_ranked = list(CLINICAL_KNOWLEDGE_CORPUS)

    # 3. Apply Reciprocal Rank Fusion (RRF) Re-ranking
    # Combines ranks from both retrieval lists: RRF_score = sum(1 / (k + rank))
    ranked_lists = []
    if sparse_ranked:
        ranked_lists.append(sparse_ranked)
    if dense_ranked:
        ranked_lists.append(dense_ranked)

    if not ranked_lists:
        return "No relevant clinical guidelines found."

    fused_results = reciprocal_rank_fusion(ranked_lists, k=60, top_n=limit)

    # Format the re-ranked results with provenance and RRF relevance score
    chunks_output = []
    for rank_idx, (chunk, rrf_score) in enumerate(fused_results, 1):
        chunks_output.append(f"[Reranked #{rank_idx} | RRF Score: {rrf_score:.4f}] {chunk}")

    return "\n\n".join(chunks_output)
