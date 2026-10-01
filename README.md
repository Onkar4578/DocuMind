# DocuMindRAG — Enterprise RAG Platform

DocuMindRAG is a production-ready, hybrid retrieval-augmented generation (RAG) platform designed for high-precision document intelligence, multi-document comparison, real-time observability, and page-accurate citation tracking.

---

## ⚡ Architecture & Key Features

```
Upload (PDF/DOCX/TXT) ➔ Semantic Chunking ➔ FAISS Vector Store + BM25 Sparse Index
                      ➔ Hybrid Query Search (Reciprocal Rank Fusion)
                      ➔ Cross-Encoder Reranking (bge-reranker-large)
                      ➔ PII Protection & Semantic Query Caching
                      ➔ LLM Answer Synthesis (Page-Cited Grounded Response)
                      ➔ FastAPI API ➔ Modern React Enterprise Interface
```

* **Hybrid Retrieval (Dense + Sparse)**: Combines FAISS dense vector embeddings (`sentence-transformers/all-MiniLM-L6-v2`) with BM25 keyword matching for exact term, numeric, and semantic recall.
* **Cross-Encoder Reranking**: Uses `bge-reranker-large` / `ms-marco-MiniLM` to re-score merged candidates, maximizing precision@k before LLM context construction.
* **Multi-Document Comparison**: Query single documents or select multiple knowledge bases simultaneously for cross-document analysis.
* **Semantic Query Cache**: In-memory vector caching for instant response generation on recurring query vectors.
* **RAG Observability & Telemetry**: Built-in metrics tracking P50/P95 latency, cache hit ratios, token consumption, retrieval recall, context relevance, and citation accuracy (`/api/admin/metrics`).
* **PII & Privacy Protection**: Automatic redaction of sensitive credentials, emails, phone numbers, and SSNs before LLM prompt submission.
* **Page-Accurate Citations & PDF Viewer**: Interactive inline citations that link directly to an integrated PDF side-drawer viewer.
* **Enterprise Modern Interface**: Built with React, Tailwind CSS, Plus Jakarta Sans, and JetBrains Mono fonts.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS, Plus Jakarta Sans & JetBrains Mono |
| **Backend API** | FastAPI (Python 3.11), Pydantic v2, SlowAPI Rate Limiting |
| **Vector Index** | FAISS / Qdrant embedded vector store |
| **Document Registry** | PostgreSQL (SQLAlchemy ORM) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Sparse Search** | BM25 (`rank_bm25`) |
| **Reranker** | Cross-Encoder (`bge-reranker-large` / `ms-marco-MiniLM`) |
| **LLM Engine** | Google Gemini (default), Groq (Llama 3.3), or Anthropic Claude |
| **Containerization** | Docker & Docker Compose |

---

## 🚀 Quick Start — Docker Compose

```bash
# 1. Clone repository & configure environment
cp backend/.env.example backend/.env

# 2. Build and launch all services (Postgres + Backend + Frontend)
docker compose up --build
```

Access services locally:
* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API Specs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Admin Telemetry JSON**: [http://localhost:8000/api/admin/metrics](http://localhost:8000/api/admin/metrics)

---

## 📡 Core API Endpoints

* `POST /api/upload` — Multipart document upload (PDF, DOCX, TXT). Auto-chunks and updates vector & BM25 indices.
* `POST /api/query` — Executes hybrid search, cross-encoder reranking, PII filtering, and LLM answer generation with citation metadata.
* `GET /api/documents` — Retrieves list of ingested documents and chunk metadata.
* `DELETE /api/documents/{doc_id}` — Removes document from vector store and PostgreSQL registry.
* `POST /api/feedback` — Logs user feedback ratings (thumbs up/down) for query evaluation.
* `GET /api/admin/metrics` — Aggregate system telemetry (latency, cache hit rate, token usage, evaluation scores).
* `GET /api/admin/logs` — Retrieves detailed query execution logs.

---

## 🔒 Security & Access Control

* **Rate Limiting**: Configured per client IP (`RATE_LIMIT_QUERY`, `RATE_LIMIT_UPLOAD`).
* **API Key Protection**: Optional header-based gate (`X-API-Key`) for public deployments.
* **PII Redaction**: Pre-synthesis filtering for privacy compliance.
