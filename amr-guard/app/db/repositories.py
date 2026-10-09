from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db import models
from app.schemas.ingestion import NormalizedDrug, NormalizedRule

class IngestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert_drug(self, drug_data: NormalizedDrug) -> models.Drug:
        stmt = select(models.Drug).where(models.Drug.generic_name == drug_data.generic_name)
        existing = self.db.execute(stmt).scalars().first()
        
        if existing:
            # Update
            for key, value in drug_data.model_dump().items():
                setattr(existing, key, value)
            drug = existing
        else:
            # Insert
            drug = models.Drug(**drug_data.model_dump())
            self.db.add(drug)
        
        self.db.commit()
        self.db.refresh(drug)
        return drug

    def upsert_rule(self, rule_data: NormalizedRule) -> models.Rule:
        stmt = select(models.Rule).where(models.Rule.code == rule_data.code)
        existing = self.db.execute(stmt).scalars().first()
        
        if existing:
            # Update
            for key, value in rule_data.model_dump().items():
                setattr(existing, key, value)
            rule = existing
        else:
            # Insert
            rule = models.Rule(**rule_data.model_dump())
            self.db.add(rule)
            
        self.db.commit()
        self.db.refresh(rule)
        return rule
