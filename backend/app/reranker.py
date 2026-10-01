"""
Reranking layer.

The merged dense + sparse candidate set is re-scored by a cross-encoder,
which looks at the (query, chunk) pair directly rather than comparing
pre-computed vectors - this precision pass is what narrows a high-recall
candidate set down to the handful of chunks actually worth sending to the
LLM, and is usually the single biggest lever on answer accuracy.
"""
import math
from functools import lru_cache
from typing import List, Tuple

from sentence_transformers import CrossEncoder

from .config import settings


@lru_cache(maxsize=1)
def get_reranker() -> CrossEncoder:
    return CrossEncoder(settings.RERANKER_MODEL_NAME)


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-float(x)))


def rerank(query: str, candidates: List[dict], top_k: int = settings.RERANK_TOP_K) -> List[Tuple[dict, float]]:
    """candidates: list of chunk payload dicts (must include 'text').
    Returns the top_k (chunk, score) pairs, highest score first."""
    if not candidates:
        return []
    model = get_reranker()
    pairs = [(query, c["text"]) for c in candidates]
    scores = model.predict(pairs)
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [(chunk, round(_sigmoid(float(score)), 4)) for chunk, score in ranked[:top_k]]
