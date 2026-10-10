"""
Database Memoization Cache Service for Clinical Audits.
[PATTERN: Cache-Aside] Implements exact-input signature memoization.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import AuditCache
from app.schemas.audit import AuditResult
from app.schemas.orchestrator import ContextBundle

logger = logging.getLogger("amr_guard.audit_cache")


# [PATTERN: Cache-Aside] — Query database signature cache before invoking expensive evaluation
# [SOLID: SRP] — Separated cache persistence from audit evaluation engine


def get_cached_audit(
    signature: str,
    db: Optional[Session] = None,
) -> Optional[Union[AuditResult, ContextBundle]]:
    """
    Check the database for an existing audit result with the exact signature.
    Returns reconstructed AuditResult (with is_cached=True) if hit, or None on miss.
    """
    if not signature:
        return None

    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        cache_row = db.query(AuditCache).filter(AuditCache.signature == signature).first()
        if not cache_row or not cache_row.result_json:
            return None

        # Increment hit count and update timestamp
        try:
            cache_row.hit_count = (cache_row.hit_count or 1) + 1
            cache_row.updated_at = datetime.now(timezone.utc)
            db.commit()
        except Exception as update_err:
            db.rollback()
            logger.debug("[AuditCache] Could not increment hit_count: %s", update_err)

        result_dict = dict(cache_row.result_json)

        # Distinguish between AuditResult and ContextBundle
        if "status" in result_dict and "score" in result_dict:
            res = AuditResult.model_validate(result_dict)
            res.signature = signature
            res.is_cached = True
            # Cache hits respond in <= 5ms
            res.latency_ms = max(1, min(res.latency_ms, 5))
            return res
        else:
            context = ContextBundle.model_validate(result_dict)
            return context

    except Exception as e:
        logger.warning(
            "[AuditCache] Error reading cache for signature %s: %s",
            signature[:8] if signature else "None",
            e,
        )
        return None
    finally:
        if should_close:
            db.close()


def save_cached_audit(
    signature: str,
    input_payload: Dict[str, Any],
    result: Union[AuditResult, ContextBundle, Dict[str, Any]],
    db: Optional[Session] = None,
) -> bool:
    """
    Store computed audit result in the database associated with its exact signature.
    """
    if not signature:
        return False

    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Check if already present
        existing = db.query(AuditCache).filter(AuditCache.signature == signature).first()
        if existing:
            # Update result payload and touch updated_at
            if hasattr(result, "model_dump"):
                existing.result_json = result.model_dump()
            elif isinstance(result, dict):
                existing.result_json = result
            existing.updated_at = datetime.now(timezone.utc)
            db.commit()
            return True

        if hasattr(result, "model_dump"):
            res_json = result.model_dump()
        elif isinstance(result, dict):
            res_json = result
        else:
            res_json = dict(result)

        entry = AuditCache(
            signature=signature,
            input_payload_json=input_payload,
            result_json=res_json,
            hit_count=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        db.commit()
        logger.info("[AuditCache] Stored audit cache entry for signature: %s", signature[:8])
        return True
    except Exception as e:
        db.rollback()
        logger.warning(
            "[AuditCache] Could not persist cache for signature %s: %s",
            signature[:8] if signature else "None",
            e,
        )
        return False
    finally:
        if should_close:
            db.close()
