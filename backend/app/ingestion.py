"""
Ingestion layer.

Parses uploaded PDFs page-by-page (page numbers preserved as metadata on
every chunk), then applies semantic chunking: splitting on structural
boundaries (paragraph breaks / sentence groups) rather than a fixed token
count, with a small overlap window so a fact near a chunk boundary is not
severed and made unretrievable.
"""
import re
import uuid
from dataclasses import dataclass
from typing import List

from pypdf import PdfReader

from .config import settings


@dataclass
class RawPage:
    page_number: int  # 1-indexed
    text: str


@dataclass
class ChunkRecord:
    chunk_id: str
    document_id: str
    document_name: str
    page_number: int
    section_type: str
    text: str


def parse_pdf(file_path: str) -> List[RawPage]:
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        pages.append(RawPage(page_number=i + 1, text=text))
    return pages


def parse_docx(file_path: str) -> List[RawPage]:
    try:
        import docx
        doc = docx.Document(file_path)
        text = "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        return [RawPage(page_number=1, text=text)]
    except Exception:
        return [RawPage(page_number=1, text="")]


def _split_into_paragraphs(text: str) -> List[str]:
    """Structural-boundary split: paragraphs, falling back to sentences
    for pages that have no blank-line structure (common in PDF extraction)."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if len(paragraphs) <= 1:
        # Fall back to sentence-level splitting for densely-packed pages
        paragraphs = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    return paragraphs


def _approx_token_count(text: str) -> int:
    # Cheap approximation (word count) - good enough for chunk sizing without
    # pulling in a tokenizer dependency.
    return len(text.split())


def semantic_chunk_page(
    page_text: str,
    chunk_size_tokens: int = settings.CHUNK_SIZE_TOKENS,
    overlap_tokens: int = settings.CHUNK_OVERLAP_TOKENS,
) -> List[str]:
    """Groups structural units (paragraphs/sentences) into chunks close to
    chunk_size_tokens, carrying an overlap window of trailing units forward
    into the next chunk so no single fact is cut across a boundary."""
    units = _split_into_paragraphs(page_text)
    if not units:
        return []

    chunks: List[str] = []
    current_units: List[str] = []
    current_tokens = 0

    for unit in units:
        unit_tokens = _approx_token_count(unit)
        if current_tokens + unit_tokens > chunk_size_tokens and current_units:
            chunks.append(" ".join(current_units))
            # Build overlap: keep trailing units whose combined token count
            # is <= overlap_tokens, carry them into the next chunk.
            overlap_units: List[str] = []
            overlap_count = 0
            for u in reversed(current_units):
                t = _approx_token_count(u)
                if overlap_count + t > overlap_tokens:
                    break
                overlap_units.insert(0, u)
                overlap_count += t
            current_units = overlap_units + [unit]
            current_tokens = overlap_count + unit_tokens
        else:
            current_units.append(unit)
            current_tokens += unit_tokens

    if current_units:
        chunks.append(" ".join(current_units))

    return chunks


def chunk_document(document_id: str, document_name: str, pages: List[RawPage]) -> List[ChunkRecord]:
    records: List[ChunkRecord] = []
    for page in pages:
        page_chunks = semantic_chunk_page(page.text)
        for chunk_text in page_chunks:
            if not chunk_text.strip():
                continue
            records.append(
                ChunkRecord(
                    chunk_id=str(uuid.uuid4()),
                    document_id=document_id,
                    document_name=document_name,
                    page_number=page.page_number,
                    section_type="body",
                    text=chunk_text,
                )
            )
    return records
