"""
Dense embedding layer.

Wraps a sentence-transformers model to produce fixed-dimension vectors for
every chunk. Model loads once (lazy singleton) and batches encoding calls.
"""
from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

from .config import settings


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(settings.EMBEDDING_MODEL_NAME)


def embed_texts(texts: List[str]) -> List[List[float]]:
    model = get_embedding_model()
    vectors = model.encode(texts, batch_size=32, show_progress_bar=False, normalize_embeddings=True)
    return vectors.tolist()


def embed_query(query: str) -> List[float]:
    return embed_texts([query])[0]


def embedding_dimension() -> int:
    model = get_embedding_model()
    return model.get_sentence_embedding_dimension()
