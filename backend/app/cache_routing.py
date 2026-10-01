"""
Semantic caching, query routing, and async ingestion management module.
"""
import math
from typing import List, Optional, Tuple


class SemanticCache:
    """In-memory semantic cache using vector similarity matching."""

    def __init__(self, max_size: int = 200, threshold: float = 0.92):
        self._cache: List[Tuple[List[float], str, str]] = []  # (query_vector, query, answer)
        self.max_size = max_size
        self.threshold = threshold

    @staticmethod
    def _cosine(a: List[float], b: List[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(x * x for x in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    def lookup(self, query_embedding: List[float]) -> Optional[str]:
        for emb, _, answer in self._cache:
            if self._cosine(query_embedding, emb) >= self.threshold:
                return answer
        return None

    def store(self, query_embedding: List[float], query: str, answer: str):
        if len(self._cache) >= self.max_size:
            self._cache.pop(0)
        self._cache.append((query_embedding, query, answer))

    def invalidate(self):
        self._cache.clear()


semantic_cache = SemanticCache()

_COMPARATIVE_KWORDS = {"compare", "difference", "versus", "vs", "contrast", "between", "both"}
_SUMMARY_KWORDS = {"summarize", "summary", "overview", "briefly", "describe"}


def route_query(query: str, base_top_k: int = 5) -> int:
    """Adjusts candidate retrieval depth based on query intent classification."""
    tokens = set(query.lower().split())
    if tokens & _COMPARATIVE_KWORDS:
        return min(base_top_k * 2, 20)
    if tokens & _SUMMARY_KWORDS:
        return min(base_top_k + 3, 15)
    return base_top_k


INGESTION_STATUS_PENDING = "PENDING"
INGESTION_STATUS_PROCESSING = "PROCESSING"
INGESTION_STATUS_COMPLETED = "COMPLETED"
INGESTION_STATUS_FAILED = "FAILED"


def update_document_status(session, document_id: str, status: str):
    """Updates document ingestion pipeline status in database."""
    from .db import Document
    doc = session.query(Document).filter(Document.document_id == document_id).first()
    if doc:
        doc.status = status
        try:
            session.commit()
        except Exception:
            session.rollback()
            raise
