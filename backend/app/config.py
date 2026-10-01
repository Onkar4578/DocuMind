import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # --- Embedding / reranker models (local, sentence-transformers) ---
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    RERANKER_MODEL_NAME: str = os.getenv("RERANKER_MODEL_NAME", "cross-encoder/ms-marco-MiniLM-L-6-v2")

    # --- Qdrant (embedded/local by default; set QDRANT_URL for a real server) ---
    QDRANT_URL: str | None = os.getenv("QDRANT_URL")
    QDRANT_LOCAL_PATH: str = os.getenv("QDRANT_LOCAL_PATH", "./qdrant_storage")
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "docmind_chunks")

    # --- LLM synthesis: pluggable provider ---
    # "groq" (default, free tier, OpenAI-compatible) or "anthropic" (Claude, paid)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq").lower()

    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

    ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    # --- Retrieval tuning ---
    CHUNK_SIZE_TOKENS: int = int(os.getenv("CHUNK_SIZE_TOKENS", "350"))
    CHUNK_OVERLAP_TOKENS: int = int(os.getenv("CHUNK_OVERLAP_TOKENS", "60"))
    DENSE_TOP_K: int = int(os.getenv("DENSE_TOP_K", "20"))
    SPARSE_TOP_K: int = int(os.getenv("SPARSE_TOP_K", "20"))
    RERANK_TOP_K: int = int(os.getenv("RERANK_TOP_K", "5"))

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploaded_pdfs")

    # --- Postgres (document registry / metadata) ---
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://docmind:docmind@localhost:5432/docmind")

    # --- Rate limiting (per client IP) ---
    RATE_LIMIT_UPLOAD: str = os.getenv("RATE_LIMIT_UPLOAD", "5/minute")
    RATE_LIMIT_QUERY: str = os.getenv("RATE_LIMIT_QUERY", "15/minute")

    # --- Optional lightweight API-key gate for public deployments ---
    # If REQUIRE_API_KEY=true, every request must include header: X-API-Key: <API_ACCESS_KEY>
    REQUIRE_API_KEY: bool = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
    API_ACCESS_KEY: str | None = os.getenv("API_ACCESS_KEY")

settings = Settings()
