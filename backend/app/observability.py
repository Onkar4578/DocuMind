"""
Observability and RAG evaluation module.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from .db import Base, engine


class QueryLog(Base):
    """Stores metrics, scores, and execution context for query runs."""
    __tablename__ = "query_logs"

    log_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    query_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    document_id = Column(String, nullable=True)
    document_ids = Column(JSON, nullable=True)
    dense_hits = Column(Integer, default=0)
    sparse_hits = Column(Integer, default=0)
    merged_candidates = Column(Integer, default=0)
    reranked_count = Column(Integer, default=0)
    top_score = Column(Float, nullable=True)
    groundedness_score = Column(Float, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    llm_provider = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class QueryFeedback(Base):
    """Stores user feedback ratings for queries."""
    __tablename__ = "query_feedback"

    feedback_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    log_id = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_observability_db():
    """Initializes observability schema tables."""
    Base.metadata.create_all(bind=engine)


def log_query(
    session,
    query_text: str,
    answer_text: str,
    document_id=None,
    document_ids=None,
    retrieval_stats: dict = None,
    top_score: float = None,
    groundedness_score: float = None,
    response_time_ms: int = None,
    llm_provider: str = None,
) -> QueryLog:
    """Records a detailed execution trace for a RAG query run."""
    stats = retrieval_stats or {}
    entry = QueryLog(
        log_id=str(uuid.uuid4()),
        query_text=query_text,
        answer_text=answer_text,
        document_id=document_id,
        document_ids=document_ids,
        dense_hits=stats.get("dense_hits", 0),
        sparse_hits=stats.get("sparse_hits", 0),
        merged_candidates=stats.get("merged_candidates", 0),
        reranked_count=stats.get("reranked", 0),
        top_score=top_score,
        groundedness_score=groundedness_score,
        response_time_ms=response_time_ms,
        llm_provider=llm_provider,
    )
    try:
        session.add(entry)
        session.commit()
        session.refresh(entry)
    except Exception:
        session.rollback()
        raise
    return entry


def save_feedback(session, log_id: str, rating: int, comment: str = None):
    """Saves user feedback for a query execution."""
    fb = QueryFeedback(
        feedback_id=str(uuid.uuid4()),
        log_id=log_id,
        rating=rating,
        comment=comment,
    )
    try:
        session.add(fb)
        session.commit()
    except Exception:
        session.rollback()
        raise


def get_metrics_summary(session) -> dict:
    """Aggregates performance, relevance, and user satisfaction metrics."""
    from sqlalchemy import func

    total = session.query(func.count(QueryLog.log_id)).scalar() or 0
    avg_top_score = session.query(func.avg(QueryLog.top_score)).scalar()
    avg_groundedness = session.query(func.avg(QueryLog.groundedness_score)).scalar()
    avg_response_ms = session.query(func.avg(QueryLog.response_time_ms)).scalar()
    thumbs_up = (
        session.query(func.count(QueryFeedback.feedback_id))
        .filter(QueryFeedback.rating == 1)
        .scalar()
        or 0
    )
    thumbs_down = (
        session.query(func.count(QueryFeedback.feedback_id))
        .filter(QueryFeedback.rating == -1)
        .scalar()
        or 0
    )
    return {
        "total_queries": total,
        "avg_relevance_score": round(float(avg_top_score), 3) if avg_top_score else None,
        "avg_groundedness": round(float(avg_groundedness), 3) if avg_groundedness else None,
        "avg_response_time_ms": round(float(avg_response_ms)) if avg_response_ms else None,
        "thumbs_up": thumbs_up,
        "thumbs_down": thumbs_down,
        "satisfaction_rate": (
            round(thumbs_up / (thumbs_up + thumbs_down), 3)
            if (thumbs_up + thumbs_down) > 0
            else None
        ),
    }


def get_recent_logs(session, limit: int = 50):
    """Fetches recent query execution logs."""
    return (
        session.query(QueryLog)
        .order_by(QueryLog.created_at.desc())
        .limit(limit)
        .all()
    )
