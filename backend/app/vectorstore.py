"""
Vector store layer (Qdrant).

Runs Qdrant in embedded/local mode by default (no server to stand up) via
QDRANT_LOCAL_PATH, so the project runs end-to-end with `uvicorn` alone.
Set QDRANT_URL in the environment to point at a real Qdrant server/cluster
instead - the rest of the code is unchanged either way.

One collection holds all chunks; every point carries payload metadata
(document_id, document_name, page_number, section_type, text) so results
can be filtered by document and re-hydrated with their source text without
a second lookup.
"""
import uuid
from typing import List, Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from .config import settings
from .embeddings import embedding_dimension
from .ingestion import ChunkRecord

_client: Optional[QdrantClient] = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        if settings.QDRANT_URL:
            _client = QdrantClient(url=settings.QDRANT_URL)
        else:
            _client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
    return _client


def ensure_collection():
    client = get_client()
    collections = [c.name for c in client.get_collections().collections]
    if settings.QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=qmodels.VectorParams(
                size=embedding_dimension(),
                distance=qmodels.Distance.COSINE,
            ),
        )


def upsert_chunks(chunks: List[ChunkRecord], vectors: List[List[float]]):
    ensure_collection()
    client = get_client()
    points = [
        qmodels.PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.chunk_id)),
            vector=vector,
            payload={
                "chunk_id": chunk.chunk_id,
                "document_id": chunk.document_id,
                "document_name": chunk.document_name,
                "page_number": chunk.page_number,
                "section_type": chunk.section_type,
                "text": chunk.text,
            },
        )
        for chunk, vector in zip(chunks, vectors)
    ]
    client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)


def dense_search(query_vector: List[float], top_k: int, document_id: Optional[str] = None, document_ids: Optional[List[str]] = None):
    ensure_collection()
    client = get_client()
    query_filter = None
    if document_ids and len(document_ids) > 0:
        query_filter = qmodels.Filter(
            must=[qmodels.FieldCondition(key="document_id", match=qmodels.MatchAny(any=document_ids))]
        )
    elif document_id:
        query_filter = qmodels.Filter(
            must=[qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=document_id))]
        )
    results = client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        query_filter=query_filter,
        limit=top_k,
        with_payload=True,
    )
    return results


def get_all_chunks_for_document(document_id: Optional[str] = None, document_ids: Optional[List[str]] = None) -> List[dict]:
    """Used to build/refresh the sparse (BM25) index against the same
    corpus the dense index searches."""
    ensure_collection()
    client = get_client()
    scroll_filter = None
    if document_ids and len(document_ids) > 0:
        scroll_filter = qmodels.Filter(
            must=[qmodels.FieldCondition(key="document_id", match=qmodels.MatchAny(any=document_ids))]
        )
    elif document_id:
        scroll_filter = qmodels.Filter(
            must=[qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=document_id))]
        )
    all_points = []
    next_offset = None
    while True:
        points, next_offset = client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            scroll_filter=scroll_filter,
            limit=256,
            offset=next_offset,
            with_payload=True,
        )
        all_points.extend(points)
        if next_offset is None:
            break
    return [p.payload for p in all_points]


def delete_document_chunks(document_id: str):
    ensure_collection()
    client = get_client()
    client.delete(
        collection_name=settings.QDRANT_COLLECTION,
        points_selector=qmodels.FilterSelector(
            filter=qmodels.Filter(
                must=[qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=document_id))]
            )
        ),
    )

