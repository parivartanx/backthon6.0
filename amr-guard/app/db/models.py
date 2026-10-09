from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class Drug(Base):
    __tablename__ = "drugs"
    id = Column(Integer, primary_key=True, index=True)
    generic_name = Column(String)
    drug_class = Column(String)
    is_antibiotic = Column(Boolean)
    aware_class = Column(String)
    is_fluoroquinolone = Column(Boolean)
    pregnancy_contraindicated = Column(Boolean)
    min_age_years = Column(Float)
    is_nephrotoxic = Column(Boolean, default=False)
    requires_egfr = Column(Boolean, default=False)
    min_egfr_safe = Column(Float, default=30.0)
    is_geriatric_contraindicated = Column(Boolean, default=False)
    requires_tdm = Column(Boolean, default=False)
    outpatient_iv_restricted = Column(Boolean, default=False)
    usage = Column(Text, nullable=True)
    side_effects = Column(Text, nullable=True)

class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String)
    drug_id = Column(Integer, ForeignKey("drugs.id"))
    default_strength = Column(String)

class Condition(Base):
    __tablename__ = "conditions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    display_name = Column(String)

class Guideline(Base):
    __tablename__ = "guidelines"
    id = Column(Integer, primary_key=True, index=True)
    condition_id = Column(Integer, ForeignKey("conditions.id"))
    source = Column(String)
    section_ref = Column(String)
    summary = Column(Text)
    antibiotic_indicated = Column(Boolean)

class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    description = Column(String)
    severity = Column(String)
    citation = Column(String)
    enabled = Column(Boolean)

class Regimen(Base):
    __tablename__ = "regimens"
    id = Column(Integer, primary_key=True, index=True)
    condition_id = Column(Integer, ForeignKey("conditions.id"))
    drug_id = Column(Integer, ForeignKey("drugs.id"))
    dose_text = Column(String)
    frequency = Column(String)
    duration_days = Column(Integer)
    source = Column(String)
    verified_by = Column(String)

class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    patient_context_json = Column(JSON)
    extracted_json = Column(JSON)
    flags_json = Column(JSON)
    score = Column(Float)
    latency_ms = Column(Integer)
    remediation_applied = Column(Boolean)

class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String, index=True, nullable=True)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=True)
    metadata_json = Column(JSON, default=dict)

