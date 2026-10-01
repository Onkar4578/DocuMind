"""
Synthesis layer - pluggable LLM provider.

LLM_PROVIDER=groq (default): free tier, OpenAI-compatible API, fast open
models (Llama 3.3 70B by default). Good fit for a public/shared demo since
it costs nothing and Groq's rate limits bound the worst case.

LLM_PROVIDER=anthropic: Claude, higher quality, paid - useful to swap in
for local/private use where you control who calls the API.

Only the top reranked chunks are sent to the LLM, each tagged with its
source page number, and the model is instructed to answer strictly from
the provided context and attach a page citation to every claim. This is
the guardrail against silent hallucination.
"""
from typing import List, Tuple

from .config import settings


def compute_groundedness(answer: str, reranked_chunks: List[Tuple[dict, float]]) -> float:
    """
    Groundedness = fraction of provided context chunks whose key phrases appear in the answer.
    Returns a score between 0.0 and 1.0.
    """
    if not reranked_chunks or not answer:
        return 0.0
    cited = 0
    for chunk, _ in reranked_chunks:
        words = [w.lower() for w in chunk["text"].split() if len(w) > 5]
        if not words:
            continue
        sample = words[:10]
        if any(w in answer.lower() for w in sample):
            cited += 1
    return round(cited / len(reranked_chunks), 3)


SYSTEM_PROMPT = """You are DocuMindRAG, a document question-answering assistant.

Rules you must follow exactly:
1. Answer ONLY using the numbered context chunks provided below. Do not use
   any outside knowledge.
2. Every factual claim in your answer must be followed by a citation referencing
   the document name and page number supporting it, e.g. [DocumentName, p.N] or [p.N].
3. If the provided context does not contain enough information to answer
   the question, say so explicitly instead of guessing.
4. Be concise and direct. Do not repeat the question back to the user.
"""


def _build_context_block(reranked_chunks: List[Tuple[dict, float]]) -> str:
    lines = []
    for i, (chunk, score) in enumerate(reranked_chunks, start=1):
        lines.append(f"[Chunk {i} | Document: {chunk['document_name']} | Page: {chunk['page_number']}]\n{chunk['text']}")
    return "\n\n".join(lines)


def _fallback_no_key_response(reranked_chunks: List[Tuple[dict, float]]) -> str:
    top = reranked_chunks[0][0] if reranked_chunks else None
    if not top:
        return "No relevant context was retrieved for this query."
    return (
        f"[LLM synthesis disabled - no API key set for provider '{settings.LLM_PROVIDER}'. "
        f"Top-ranked supporting chunk, page {top['page_number']}: \"{top['text'][:300]}...\"]"
    )


def _synthesize_groq(query: str, reranked_chunks: List[Tuple[dict, float]]) -> str:
    from openai import OpenAI  # Groq exposes an OpenAI-compatible endpoint

    client = OpenAI(api_key=settings.GROQ_API_KEY, base_url=settings.GROQ_BASE_URL)
    context_block = _build_context_block(reranked_chunks)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        max_tokens=2000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n\n{context_block}\n\nQuestion: {query}"},
        ],
    )
    return response.choices[0].message.content


def _synthesize_anthropic(query: str, reranked_chunks: List[Tuple[dict, float]]) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    context_block = _build_context_block(reranked_chunks)

    message = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Context:\n\n{context_block}\n\nQuestion: {query}"}],
    )
    return "".join(block.text for block in message.content if block.type == "text")


def synthesize_answer(query: str, reranked_chunks: List[Tuple[dict, float]]) -> str:
    provider = settings.LLM_PROVIDER

    if provider == "groq":
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.strip() in ("", "your_groq_key_here"):
            return _fallback_no_key_response(reranked_chunks)
        try:
            return _synthesize_groq(query, reranked_chunks)
        except Exception as e:
            top = reranked_chunks[0][0] if reranked_chunks else None
            top_info = f"\n\nTop-ranked supporting chunk (p.{top['page_number']}): \"{top['text'][:300]}...\"" if top else ""
            return f"[LLM Provider Error ({provider}): {e}{top_info}]"

    if provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY.strip() in ("", "your_anthropic_key_here"):
            return _fallback_no_key_response(reranked_chunks)
        try:
            return _synthesize_anthropic(query, reranked_chunks)
        except Exception as e:
            top = reranked_chunks[0][0] if reranked_chunks else None
            top_info = f"\n\nTop-ranked supporting chunk (p.{top['page_number']}): \"{top['text'][:300]}...\"" if top else ""
            return f"[LLM Provider Error ({provider}): {e}{top_info}]"

    raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Use 'groq' or 'anthropic'.")
