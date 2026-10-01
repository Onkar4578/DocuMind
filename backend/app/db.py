"""
Postgres-backed document registry.

Replaces the earlier in-memory dict: metadata for every uploaded document
(name, page/chunk counts, upload time) is persisted here, so it survives
backend restarts and is safe under concurrent writers - the actual chunk
text + vectors still live in Qdrant, this table is just the index over
"what documents exist."
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import create_engine, Column, String, Integer, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_name = Column(String, nullable=False)
    num_pages = Column(Integer, nullable=False)
    num_chunks = Column(Integer, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="COMPLETED")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;"))
        conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'COMPLETED';"))



def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def save_document(
    session,
    document_id: str,
    document_name: str,
    num_pages: int,
    num_chunks: int,
    file_size_bytes: int | None = None,
    status: str = "COMPLETED",
):
    try:
        doc = Document(
            document_id=document_id,
            document_name=document_name,
            num_pages=num_pages,
            num_chunks=num_chunks,
            file_size_bytes=file_size_bytes,
            status=status,
        )
        session.add(doc)
        session.commit()
        session.refresh(doc)
        return doc
    except Exception:
        session.rollback()
        raise


def get_document(session, document_id: str):
    return session.query(Document).filter(Document.document_id == document_id).first()


def delete_document(session, document_id: str) -> bool:
    try:
        doc = get_document(session, document_id)
        if doc:
            session.delete(doc)
            session.commit()
            return True
        return False
    except Exception:
        session.rollback()
        raise


def list_documents(session):
    return session.query(Document).order_by(Document.created_at.desc()).all()
