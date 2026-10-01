"""
Admin and system observability endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import db
from .. import observability as obs
from ..cache_routing import semantic_cache
from .deps import require_api_key

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics", dependencies=[Depends(require_api_key)])
def admin_metrics(session: Session = Depends(db.get_session)):
    """Retrieve system performance metrics and observability aggregate data."""
    metrics = obs.get_metrics_summary(session)
    doc_count = len(db.list_documents(session))
    metrics["total_documents"] = doc_count
    metrics["cache_size"] = len(semantic_cache._cache)
    return metrics


@router.get("/logs", dependencies=[Depends(require_api_key)])
def admin_logs(limit: int = 50, session: Session = Depends(db.get_session)):
    """Retrieve recent query logs for inspection."""
    logs = obs.get_recent_logs(session, limit=limit)
    return [
        {
            "log_id": l.log_id,
            "query_text": l.query_text,
            "answer_preview": (l.answer_text or "")[:200],
            "groundedness": l.groundedness_score,
            "top_score": l.top_score,
            "response_time_ms": l.response_time_ms,
            "reranked_count": l.reranked_count,
            "llm_provider": l.llm_provider,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


@router.delete("/cache", dependencies=[Depends(require_api_key)])
def clear_cache():
    """Manually flushes in-memory semantic query cache."""
    semantic_cache.invalidate()
    return {"message": "Semantic cache cleared."}
