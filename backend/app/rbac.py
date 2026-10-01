"""
Role-based access control, document versioning, and PII protection module.
"""
import re
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from .db import Base, engine


class User(Base):
    """User account model for permission management."""
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False, default="viewer")  # "admin" | "viewer"
    api_key = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DocumentPermission(Base):
    """Document-level access control permissions."""
    __tablename__ = "document_permissions"

    perm_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    can_read = Column(Boolean, default=True)
    can_delete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DocumentVersion(Base):
    """Document revision history tracker."""
    __tablename__ = "document_versions"

    version_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    document_name = Column(String, nullable=False)
    num_pages = Column(Integer, nullable=False)
    num_chunks = Column(Integer, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_rbac_db():
    """Initializes RBAC schema tables."""
    Base.metadata.create_all(bind=engine)


_PII_PATTERNS = [
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"), "[EMAIL]"),
    (re.compile(r"\b(\+91[\-\s]?)?[6-9]\d{9}\b"), "[PHONE]"),
    (re.compile(r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b"), "[SSN]"),
    (re.compile(r"\b(?:\d[ -]*?){13,16}\b"), "[CARD]"),
    (re.compile(r"\b\d{4}\s\d{4}\s\d{4}\b"), "[AADHAR]"),
]


def scrub_pii(text: str) -> tuple[str, list[str]]:
    """Redacts PII patterns from text content and returns (scrubbed_text, detections)."""
    detections = []
    for pattern, label in _PII_PATTERNS:
        matches = pattern.findall(text)
        if matches:
            detections.append(f"{label}: {len(matches)} instance(s) found")
            text = pattern.sub(label, text)
    return text, detections


def save_document_version(
    session,
    document_id: str,
    document_name: str,
    num_pages: int,
    num_chunks: int,
    file_size_bytes: int = None,
):
    """Records a new version snapshot for a document."""
    from sqlalchemy import func

    max_ver = (
        session.query(func.max(DocumentVersion.version_number))
        .filter(DocumentVersion.document_id == document_id)
        .scalar()
        or 0
    )
    ver = DocumentVersion(
        document_id=document_id,
        version_number=max_ver + 1,
        document_name=document_name,
        num_pages=num_pages,
        num_chunks=num_chunks,
        file_size_bytes=file_size_bytes,
    )
    session.add(ver)
    session.commit()
    return ver


def get_document_versions(session, document_id: str):
    """Retrieves all version snapshots for a document."""
    return (
        session.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )
