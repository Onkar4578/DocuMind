"""
DocuMindRAG FastAPI application entrypoint.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from . import db
from . import observability as obs
from .rbac import init_rbac_db
from .api.documents import router as documents_router
from .api.upload import router as upload_router
from .api.query import router as query_router
from .api.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("documindrag")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown initialization handler."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    db.init_db()
    obs.init_observability_db()
    init_rbac_db()
    logger.info("DocuMindRAG storage and database subsystems initialized successfully.")
    yield


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="DocuMindRAG API",
    description="Enterprise Hybrid RAG API with Vector + Sparse Search, Reranking, PII Protection, and Observability",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(documents_router)
app.include_router(upload_router)
app.include_router(query_router)
app.include_router(admin_router)


@app.get("/health", tags=["health"])
def health():
    """System health check endpoint."""
    return {"status": "ok", "llm_provider": settings.LLM_PROVIDER, "version": "2.0.0"}
