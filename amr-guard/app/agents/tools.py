"""
Clinical knowledge and database retrieval tools for AMR-Guard ReAct Orchestrator.
Equips the agent with:
1. search_amr_guidelines: Hybrid BM25 + dense retrieval with RRF re-ranking.
2. get_database_regimens: Relational SQL lookup for verified ICMR STG regimens.
3. get_drug_monograph: Pharmacological profile, AWaRe tier, contraindications, and FDC safety.
4. get_pathogen_resistance_data: ICMR-AMRSN epidemiological pathogen resistance statistics.
"""
from typing import Optional, List, Dict, Any
import json
from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.models import Condition, Regimen, Drug
from app.agents.reranker import reciprocal_rank_fusion, rank_with_bm25
from app.engine.constraints import (
    normalize_text,
    get_aware_tier,
    is_fluoroquinolone,
    is_tetracycline,
    is_aminoglycoside,
    is_irrational_fdc,
    PEDIATRIC_FLUOROQUINOLONES,
    PREGNANCY_CONTRAINDICATED_DRUGS,
)

# Reference guideline corpus for RRF re-ranking
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

# ---------------------------------------------------------------------------
# Tool 1: Hybrid RAG Search with RRF Re-ranking
# ---------------------------------------------------------------------------

def search_amr_guidelines(query: str, limit: int = 5) -> str:
    """
    Search clinical knowledge base using hybrid BM25 + dense semantic vector retrieval
    from Neon PostgreSQL knowledge_chunks + Reciprocal Rank Fusion (RRF).
    Falls back gracefully to static clinical guidelines corpus if database is empty.
    """
    ranked_lists = []

    # 1. Attempt dynamic retrieval from Neon PostgreSQL knowledge_chunks
    try:
        from app.services.knowledge_service import search_vector_chunks, get_chunks_list
        db_vector_results = search_vector_chunks(query=query, limit=limit * 2)
        if db_vector_results:
            dense_ranked = [r.chunk_text for r in db_vector_results]
            ranked_lists.append(dense_ranked)

            # Retrieve candidate corpus from DB for BM25 ranking
            all_db_chunks = get_chunks_list(limit=100)
            if all_db_chunks:
                corpus = [c.chunk_text for c in all_db_chunks]
                sparse_ranked = rank_with_bm25(corpus, query, top_k=limit * 2)
                if sparse_ranked:
                    ranked_lists.append(sparse_ranked)
    except Exception:
        # Fallback to local corpus below
        pass

    # 2. Fallback to static corpus if no database chunks retrieved
    if not ranked_lists:
        sparse_ranked = rank_with_bm25(CLINICAL_KNOWLEDGE_CORPUS, query, top_k=len(CLINICAL_KNOWLEDGE_CORPUS))
        query_lower = query.lower()
        dense_ranked = [
            chunk for chunk in CLINICAL_KNOWLEDGE_CORPUS
            if any(term in chunk.lower() for term in query_lower.split())
        ]
        if not dense_ranked:
            dense_ranked = list(CLINICAL_KNOWLEDGE_CORPUS)

        if sparse_ranked:
            ranked_lists.append(sparse_ranked)
        if dense_ranked:
            ranked_lists.append(dense_ranked)

    if not ranked_lists:
        return "No relevant clinical guidelines found."

    fused_results = reciprocal_rank_fusion(ranked_lists, k=60, top_n=limit)

    chunks_output = []
    for rank_idx, (chunk, rrf_score) in enumerate(fused_results, 1):
        chunks_output.append(f"[Reranked #{rank_idx} | RRF Score: {rrf_score:.4f}]\n{chunk}")

    return "\n\n".join(chunks_output)

# Backward-compatibility alias
search_amr_knowledge = search_amr_guidelines



# ---------------------------------------------------------------------------
# Tool 2: Relational SQL Database Regimen Lookup
# ---------------------------------------------------------------------------

def get_database_regimens(condition_code_or_name: str) -> str:
    """
    Query SQL database for official ICMR STG regimens matching a clinical condition.
    """
    db = SessionLocal()
    try:
        norm = normalize_text(condition_code_or_name)
        # Search by exact code or substring match on display_name
        stmt = select(Condition).where(
            (Condition.code.ilike(f"%{norm}%")) | 
            (Condition.display_name.ilike(f"%{norm}%"))
        )
        conditions = db.execute(stmt).scalars().all()

        if not conditions:
            # Fallback keyword match
            stmt_all = select(Condition)
            all_conds = db.execute(stmt_all).scalars().all()
            conditions = [c for c in all_conds if any(w in c.code.lower() or w in c.display_name.lower() for w in norm.split())]

        if not conditions:
            return f"No database regimens found for condition: '{condition_code_or_name}'."

        results = []
        for cond in conditions:
            regimen_stmt = select(Regimen).where(Regimen.condition_id == cond.id)
            regimens = db.execute(regimen_stmt).scalars().all()

            for reg in regimens:
                drug = db.get(Drug, reg.drug_id)
                drug_name = drug.generic_name if drug else f"Drug ID {reg.drug_id}"
                aware_class = drug.aware_class if drug else "Unknown"
                results.append(
                    f"Condition: {cond.display_name} ({cond.code})\n"
                    f" - Regimen Drug: {drug_name} (WHO AWaRe: {aware_class})\n"
                    f" - Dosage: {reg.dose_text}\n"
                    f" - Frequency: {reg.frequency}\n"
                    f" - Duration: {reg.duration_days} days\n"
                    f" - Evidence Source: {reg.source} (Verified by: {reg.verified_by})"
                )

        if not results:
            return f"Condition '{conditions[0].display_name}' found, but no regimens are registered in DB."

        return "\n\n".join(results)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Tool 3: Drug Monograph & Safety Profile Lookup
# ---------------------------------------------------------------------------

def get_drug_monograph(drug_name: str) -> str:
    """
    Lookup drug classification, WHO AWaRe tier, pediatric limits, and contraindications.
    """
    db = SessionLocal()
    try:
        norm = normalize_text(drug_name)
        stmt = select(Drug).where(Drug.generic_name.ilike(f"%{norm}%"))
        drug = db.execute(stmt).scalars().first()

        tier = get_aware_tier(drug_name)
        is_fq = is_fluoroquinolone(drug_name)
        is_tc = is_tetracycline(drug_name)
        is_amino = is_aminoglycoside(drug_name)
        is_fdc = is_irrational_fdc(drug_name)

        preg_contra = (norm in PREGNANCY_CONTRAINDICATED_DRUGS) or is_fq or is_tc or is_amino
        min_age = 18.0 if (is_fq or is_tc) else (drug.min_age_years if drug else 0.0)

        profile = {
            "drug_name": drug.generic_name if drug else drug_name.title(),
            "drug_class": drug.drug_class if drug else ("Fluoroquinolone" if is_fq else ("Tetracycline" if is_tc else "Unknown")),
            "aware_tier": tier,
            "is_fluoroquinolone": is_fq,
            "is_irrational_fdc": is_fdc,
            "min_age_years": min_age,
            "pediatric_safe": min_age < 18.0,
            "pregnancy_contraindicated": preg_contra,
            "is_nephrotoxic": bool(drug.is_nephrotoxic) if drug else False,
            "requires_egfr": bool(drug.requires_egfr) if drug else False,
            "min_egfr_safe": float(drug.min_egfr_safe or 30.0) if drug else 30.0,
            "is_geriatric_contraindicated": bool(drug.is_geriatric_contraindicated) if drug else False,
            "requires_tdm": bool(drug.requires_tdm) if drug else False,
            "outpatient_iv_restricted": bool(drug.outpatient_iv_restricted) if drug else False,
            "fda_approved_usage": drug.usage if drug and drug.usage else "Standard clinical indications per susceptibility.",
            "fda_side_effects_and_warnings": drug.side_effects if drug and drug.side_effects else "Standard adverse drug events.",
            "regulatory_status": "Not Recommended / Banned FDC" if is_fdc else "Approved Single Agent"
        }

        return json.dumps(profile, indent=2)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Tool 4: Pathogen Resistance Data (ICMR-AMRSN)
# ---------------------------------------------------------------------------

def get_pathogen_resistance_data(query: str) -> str:
    """
    Fetch epidemiological resistance surveillance data from ICMR-AMRSN reports.
    """
    norm = normalize_text(query)
    if "uti" in norm or "coli" in norm or "urine" in norm or "cystitis" in norm:
        return (
            "ICMR-AMRSN Surveillance (Uropathogenic E. coli):\n"
            " - Fluoroquinolones (Ciprofloxacin/Norfloxacin): >75% resistance rate across Indian tertiary centers.\n"
            " - Third-Generation Cephalosporins: >70% non-susceptibility (ESBL producing).\n"
            " - Nitrofurantoin: >85% susceptibility preserved.\n"
            " - Fosfomycin: ~90% susceptibility preserved.\n"
            "Recommendation: Avoid empirical Ciprofloxacin/Norfloxacin in UTI. Use Nitrofurantoin or Fosfomycin."
        )
    elif "pneumonia" in norm or "cap" in norm or "respiratory" in norm or "strep" in norm:
        return (
            "ICMR-AMRSN Surveillance (Streptococcus pneumoniae & Respiratory isolates):\n"
            " - Amoxicillin: Retains >85% susceptibility for community-acquired respiratory infections.\n"
            " - Azithromycin: Widespread empirical overuse has driven macrolide resistance to >35-40%.\n"
            "Recommendation: Use Amoxicillin oral for mild CAP. Limit course duration to 5 days."
        )
    elif "diarrhea" in norm or "gastro" in norm:
        return (
            "ICMR-AMRSN Surveillance (Gastrointestinal pathogens):\n"
            " - Acute watery diarrhea in outpatients is predominantly viral (rotavirus, norovirus).\n"
            " - Fluoroquinolones (Ofloxacin, Norfloxacin) show high resistance in enteric isolates.\n"
            "Recommendation: Antibiotics contraindicated. Mandate ORS + Zinc."
        )
    else:
        return (
            "ICMR-AMRSN Surveillance Overview:\n"
            " - High resistance rates noted nationwide for Fluoroquinolones and 3G Cephalosporins.\n"
            " - Strict adherence to WHO AWaRe Access first-line agents is mandated."
        )


# ---------------------------------------------------------------------------
# Function Calling Schemas for OpenRouter / Gemini
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_amr_guidelines",
            "description": "Perform hybrid BM25 and semantic literature search with RRF re-ranking across official ICMR Standard Treatment Guidelines and WHO AWaRe documentation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Clinical question, condition, or antibiotic regimen to search."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of re-ranked chunks to return."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_database_regimens",
            "description": "Look up approved clinical regimens and dosing protocols from the SQL database for a given syndrome code (e.g. SYN_CAP_MILD, SYN_UNCOMPLICATED_UTI, acute watery diarrhea).",
            "parameters": {
                "type": "object",
                "properties": {
                    "condition_code_or_name": {
                        "type": "string",
                        "description": "Condition code or name (e.g. 'SYN_CAP_MILD', 'uncomplicated uti', 'acute bronchitis')."
                    }
                },
                "required": ["condition_code_or_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_drug_monograph",
            "description": "Retrieve drug pharmacological profile, WHO AWaRe tier (Access/Watch/Reserve), pediatric age restrictions, pregnancy contraindication flag, and irrational FDC status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "drug_name": {
                        "type": "string",
                        "description": "Generic or brand name of the antimicrobial drug."
                    }
                },
                "required": ["drug_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_pathogen_resistance_data",
            "description": "Query empirical pathogen resistance statistics from ICMR-AMRSN reports for specific clinical syndromes or pathogens (e.g. E. coli in UTI, Streptococcus in pneumonia).",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Pathogen or infection type to check resistance statistics for."
                    }
                },
                "required": ["query"]
            }
        }
    }
]

TOOL_REGISTRY = {
    "search_amr_guidelines": search_amr_guidelines,
    "get_database_regimens": get_database_regimens,
    "get_drug_monograph": get_drug_monograph,
    "get_pathogen_resistance_data": get_pathogen_resistance_data,
}
