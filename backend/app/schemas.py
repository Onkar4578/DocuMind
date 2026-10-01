from pydantic import BaseModel
from typing import List, Optional


class Chunk(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    page_number: int
    section_type: Optional[str] = "body"
    text: str


class UploadResponse(BaseModel):
    document_id: str
    document_name: str
    num_pages: int
    num_chunks: int
    message: str


class Citation(BaseModel):
    document_id: Optional[str] = None
    chunk_id: Optional[str] = None
    page_number: int
    document_name: str
    snippet: str
    score: float


class QueryRequest(BaseModel):
    query: str
    document_id: Optional[str] = None  # scope to one doc, or search all if None
    document_ids: Optional[List[str]] = None  # scope to multiple specific docs for comparison
    top_k: Optional[int] = None


class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    retrieval_stats: dict
    log_id: Optional[str] = None
