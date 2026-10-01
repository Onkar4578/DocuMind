"""
Document upload and ingestion processing route.
"""
import os
import shutil
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, BackgroundTasks
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..config import settings
from ..ingestion import parse_pdf, chunk_document
from ..embeddings import embed_texts
from ..vectorstore import upsert_chunks
from ..schemas import UploadResponse
from .. import db
from ..rbac import scrub_pii, save_document_version
from ..cache_routing import (
    semantic_cache,
    update_document_status,
    INGESTION_STATUS_PROCESSING,
    INGESTION_STATUS_COMPLETED,
    INGESTION_STATUS_FAILED,
)
from .deps import require_api_key

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/upload", tags=["upload"])


def _async_ingest_worker(document_id: str, save_path: str, filename: str, session_factory):
    """Background task handler for larger document processing pipeline."""
    session = session_factory()
    try:
        update_document_status(session, document_id, INGESTION_STATUS_PROCESSING)
        pages = parse_pdf(save_path)
        chunks = chunk_document(document_id, filename, pages)
        if not chunks:
            update_document_status(session, document_id, INGESTION_STATUS_FAILED)
            return

        clean_chunks = []
        for chunk in chunks:
            scrubbed, _ = scrub_pii(chunk.text)
            chunk.text = scrubbed
            clean_chunks.append(chunk)

        vectors = embed_texts([c.text for c in clean_chunks])
        upsert_chunks(clean_chunks, vectors)

        file_size = os.path.getsize(save_path) if os.path.exists(save_path) else None
        save_document_version(session, document_id, filename, len(pages), len(clean_chunks), file_size)
        update_document_status(session, document_id, INGESTION_STATUS_COMPLETED)
    except Exception as exc:
        logger.error("Async ingestion failed for document %s: %s", document_id, exc)
        update_document_status(session, document_id, INGESTION_STATUS_FAILED)
    finally:
        session.close()


@router.post("", response_model=UploadResponse, dependencies=[Depends(require_api_key)])
@limiter.limit(settings.RATE_LIMIT_UPLOAD)
async def upload_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session: Session = Depends(db.get_session),
):
    """Processes PDF file uploads with text extraction, PII redacting, vector indexing, and versioning."""
    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in (".pdf", ".docx", ".txt"):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

    document_id = str(uuid.uuid4())
    save_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}{ext}")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if ext == ".pdf":
        pages = parse_pdf(save_path)
    elif ext == ".docx":
        from ..ingestion import parse_docx
        pages = parse_docx(save_path)
    else:
        from ..ingestion import RawPage
        with open(save_path, "r", encoding="utf-8", errors="ignore") as tf:
            txt_content = tf.read()
        pages = [RawPage(page_number=1, text=txt_content)]

    chunks = chunk_document(document_id, file.filename, pages)
    if not chunks:
        raise HTTPException(status_code=422, detail="No extractable text found in file.")

    pii_detections = []
    clean_chunks = []
    for chunk in chunks:
        scrubbed, detections = scrub_pii(chunk.text)
        chunk.text = scrubbed
        clean_chunks.append(chunk)
        pii_detections.extend(detections)

    vectors = embed_texts([c.text for c in clean_chunks])
    upsert_chunks(clean_chunks, vectors)

    file_size = os.path.getsize(save_path) if os.path.exists(save_path) else None
    db.save_document(
        session,
        document_id,
        file.filename,
        len(pages),
        len(clean_chunks),
        file_size_bytes=file_size,
        status=INGESTION_STATUS_COMPLETED,
    )

    save_document_version(session, document_id, file.filename, len(pages), len(clean_chunks), file_size)
    semantic_cache.invalidate()

    msg = "Document ingested and indexed successfully."
    if pii_detections:
        msg += f" PII redacted: {'; '.join(set(pii_detections))}."

    return UploadResponse(
        document_id=document_id,
        document_name=file.filename,
        num_pages=len(pages),
        num_chunks=len(clean_chunks),
        message=msg,
    )
