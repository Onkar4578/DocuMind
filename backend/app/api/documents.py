"""
Document management routes.
"""
import os
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..config import settings
from .. import db
from ..vectorstore import delete_document_chunks
from ..rbac import get_document_versions
from ..cache_routing import semantic_cache
from .deps import require_api_key

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[dict])
def list_documents(session: Session = Depends(db.get_session)):
    """Retrieve metadata list of all registered documents."""
    docs = db.list_documents(session)
    return [
        {
            "document_id": d.document_id,
            "document_name": d.document_name,
            "num_pages": d.num_pages,
            "num_chunks": d.num_chunks,
            "file_size_bytes": getattr(d, "file_size_bytes", None),
            "status": getattr(d, "status", "COMPLETED"),
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


@router.get("/{document_id}/pdf")
def get_document_pdf(document_id: str, session: Session = Depends(db.get_session)):
    """Stream stored document PDF file."""
    doc = db.get_document(session, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    pdf_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

    return FileResponse(pdf_path, media_type="application/pdf", filename=doc.document_name)


@router.get("/{document_id}/versions")
def list_document_versions(document_id: str, session: Session = Depends(db.get_session)):
    """Retrieve revision audit trail for a specific document."""
    doc = db.get_document(session, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    versions = get_document_versions(session, document_id)
    return [
        {
            "version_id": v.version_id,
            "version_number": v.version_number,
            "document_name": v.document_name,
            "num_pages": v.num_pages,
            "num_chunks": v.num_chunks,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]


@router.delete("/{document_id}", dependencies=[Depends(require_api_key)])
def delete_document(document_id: str, session: Session = Depends(db.get_session)):
    """Remove a document from vector store, disk storage, and database registry."""
    doc = db.get_document(session, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    delete_document_chunks(document_id)
    pdf_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.pdf")
    if os.path.exists(pdf_path):
        try:
            os.remove(pdf_path)
        except OSError as err:
            logger.warning("Failed to remove PDF file from disk: %s", err)

    db.delete_document(session, document_id)
    semantic_cache.invalidate()

    return {"message": "Document deleted successfully", "document_id": document_id}
