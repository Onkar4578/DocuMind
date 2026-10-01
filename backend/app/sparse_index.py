"""
Sparse (BM25) index.

Runs alongside dense retrieval to catch exact keyword and numeric matches
that dense embeddings often blur (part numbers, dates, precise figures).
Rebuilt from the same payload store as the vector DB so both retrieval
passes always search the identical corpus.
"""
import re
from typing import List, Optional

from rank_bm25 import BM25Okapi

from .vectorstore import get_all_chunks_for_document


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


class SparseIndex:
    def __init__(self, document_id: Optional[str] = None, document_ids: Optional[List[str]] = None):
        self.chunks = get_all_chunks_for_document(document_id=document_id, document_ids=document_ids)
        corpus = [_tokenize(c["text"]) for c in self.chunks]
        self.bm25 = BM25Okapi(corpus) if corpus else None

    def search(self, query: str, top_k: int):
        if not self.bm25:
            return []
        scores = self.bm25.get_scores(_tokenize(query))
        ranked = sorted(zip(self.chunks, scores), key=lambda x: x[1], reverse=True)
        return [(chunk, float(score)) for chunk, score in ranked[:top_k] if score > 0]


def sparse_search(query: str, top_k: int, document_id: Optional[str] = None, document_ids: Optional[List[str]] = None):
    index = SparseIndex(document_id=document_id, document_ids=document_ids)
    return index.search(query, top_k)
