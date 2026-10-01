"""
Query and RAG search pipeline routes.
"""
import time
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..config import settings
from ..embeddings import embed_query
from ..vectorstore import dense_search
from ..sparse_index import sparse_search
from ..reranker import rerank
from ..llm import synthesize_answer, compute_groundedness
from ..schemas import QueryRequest, QueryResponse, Citation
from .. import db
from .. import observability as obs
from ..cache_routing import semantic_cache, route_query
from .deps import require_api_key

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["query"])


class FeedbackRequest(BaseModel):
    log_id: str
    rating: int  # 1 = thumbs up, -1 = thumbs down
    comment: Optional[str] = None


@router.post("/query", response_model=QueryResponse, dependencies=[Depends(require_api_key)])
@limiter.limit(settings.RATE_LIMIT_QUERY)
async def query(request: Request, body: QueryRequest, session: Session = Depends(db.get_session)):
    """Executes hybrid vector + BM25 search, cross-encoder reranking, and LLM answer generation."""
    if body.document_id and not db.get_document(session, body.document_id):
        raise HTTPException(status_code=404, detail="Unknown document_id.")

    start_time = time.time()

    query_vector = embed_query(body.query)
    cached_answer = semantic_cache.lookup(query_vector)
    if cached_answer:
        return QueryResponse(
            answer=cached_answer,
            citations=[],
            retrieval_stats={
                "cache_hit": True,
                "dense_hits": 0,
                "sparse_hits": 0,
                "merged_candidates": 0,
                "reranked": 0,
            },
        )

    base_top_k = body.top_k or settings.RERANK_TOP_K
    top_k = route_query(body.query, base_top_k)

    dense_results = dense_search(
        query_vector, settings.DENSE_TOP_K, document_id=body.document_id, document_ids=body.document_ids
    )
    dense_candidates = [r.payload for r in dense_results]

    sparse_results = sparse_search(
        body.query, settings.SPARSE_TOP_K, document_id=body.document_id, document_ids=body.document_ids
    )
    sparse_candidates = [c for c, _ in sparse_results]

    merged: dict[str, dict] = {}
    for candidate in dense_candidates + sparse_candidates:
        merged[candidate["chunk_id"]] = candidate
    candidates = list(merged.values())

    if not candidates:
        return QueryResponse(
            answer="No relevant content was found for this question. Try rephrasing, or upload a document first.",
            citations=[],
            retrieval_stats={"dense_hits": 0, "sparse_hits": 0, "merged_candidates": 0, "reranked": 0},
        )

    reranked = rerank(body.query, candidates, top_k=top_k)
    filtered_reranked = [r for r in reranked if r[1] >= 0.05]
    if filtered_reranked:
        reranked = filtered_reranked

    answer = synthesize_answer(body.query, reranked)
    semantic_cache.store(query_vector, body.query, answer)

    groundedness = compute_groundedness(answer, reranked)
    top_score = reranked[0][1] if reranked else None
    response_time_ms = int((time.time() - start_time) * 1000)

    retrieval_stats = {
        "dense_hits": len(dense_candidates),
        "sparse_hits": len(sparse_candidates),
        "merged_candidates": len(candidates),
        "reranked": len(reranked),
        "groundedness": groundedness,
        "top_relevance_score": top_score,
        "response_time_ms": response_time_ms,
        "query_route": "comparative" if top_k > (body.top_k or settings.RERANK_TOP_K) else "standard",
    }

    log_id = None
    try:
        log_entry = obs.log_query(
            session,
            query_text=body.query,
            answer_text=answer,
            document_id=body.document_id,
            document_ids=body.document_ids,
            retrieval_stats=retrieval_stats,
            top_score=top_score,
            groundedness_score=groundedness,
            response_time_ms=response_time_ms,
            llm_provider=settings.LLM_PROVIDER,
        )
        log_id = log_entry.log_id
    except Exception as exc:
        logger.warning("Failed to save query observability log: %s", exc)

    citations = [
        Citation(
            document_id=chunk.get("document_id"),
            chunk_id=str(chunk.get("chunk_id", "")),
            page_number=chunk["page_number"],
            document_name=chunk["document_name"],
            snippet=chunk["text"][:280],
            score=score,
        )
        for chunk, score in reranked
    ]

    return QueryResponse(
        answer=answer,
        citations=citations,
        retrieval_stats=retrieval_stats,
        log_id=log_id,
    )


@router.post("/feedback", dependencies=[Depends(require_api_key)])
def submit_feedback(body: FeedbackRequest, session: Session = Depends(db.get_session)):
    """Records user thumbs up/down rating for query evaluation."""
    if body.rating not in (1, -1):
        raise HTTPException(status_code=400, detail="Rating must be 1 (thumbs up) or -1 (thumbs down).")
    obs.save_feedback(session, body.log_id, body.rating, body.comment)
    return {"message": "Feedback recorded. Thank you!"}
