import json
import logging
import os
from typing import Any

from duckduckgo_search import DDGS
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

from knowledge_base import search_documents

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a biblical and historical research assistant for Glorious Restoration Embassy. "
    "Answer ONLY factual, verifiable questions about the Bible and church history. "
    "Always cite your sources. If a question is outside this scope, politely decline."
)


def document_retriever(query: str) -> list[dict[str, Any]]:
    """Search the indexed church documents for relevant Bible or church history passages."""
    return search_documents(query, limit=5)


def web_search(query: str) -> list[dict[str, Any]]:
    """Search the public web for general or historical context outside the local documents."""
    try:
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=5)
    except Exception:
        return []

    payload: list[dict[str, Any]] = []
    for result in results:
        payload.append(
            {
                "title": result.get("title") or "Web result",
                "url": result.get("href") or result.get("url") or "",
                "snippet": result.get("body") or result.get("snippet") or "",
            }
        )
    return payload


def build_llms() -> list[tuple[str, Any]]:
    """Construct configured providers in preferred order, skipping unavailable clients."""
    providers: list[tuple[str, Any]] = []
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            providers.append(
                (
                    "Groq",
                    ChatGroq(
                        model="llama-3.3-70b-versatile",
                        api_key=groq_key,
                        temperature=0.1,
                    ),
                )
            )
        except Exception:
            logger.warning("Could not initialize Groq; trying the next configured provider.")

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            providers.append(
                (
                    "Gemini",
                    ChatGoogleGenerativeAI(
                        model="gemini-1.5-flash",
                        api_key=gemini_key,
                        temperature=0.1,
                    ),
                )
            )
        except Exception:
            logger.warning("Could not initialize Gemini.")

    return providers


def build_llm() -> Any:
    """Backward-compatible access to the preferred configured provider."""
    providers = build_llms()
    return providers[0][1] if providers else None


def invoke_with_fallback(prompt: str, providers: list[tuple[str, Any]]) -> Any:
    """Invoke configured providers in order, falling back on runtime failures."""
    last_error: Exception | None = None
    for provider_name, provider in providers:
        try:
            return provider.invoke(prompt)
        except Exception as error:
            last_error = error
            logger.warning(
                "%s invocation failed (%s); trying the next configured provider.",
                provider_name,
                type(error).__name__,
            )

    if last_error is not None:
        raise RuntimeError("All configured AI providers failed.") from None
    raise RuntimeError("No AI providers are configured.")


def _format_sources(docs: list[dict[str, Any]], web_results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    seen: set[str] = set()

    for item in docs:
        url = item.get("url") or ""
        if not url:
            continue
        key = f"doc::{url}"
        if key in seen:
            continue
        seen.add(key)
        sources.append({"title": item.get("title") or "Document", "url": url, "type": "document"})

    for result in web_results:
        url = (result.get("url") or "").strip()
        if not url:
            continue
        key = f"web::{url}"
        if key in seen:
            continue
        seen.add(key)
        sources.append({"title": result.get("title") or "Web result", "url": url, "type": "web"})

    return sources[:8]


def answer_question(question: str) -> dict[str, Any]:
    question = (question or "").strip()
    if not question:
        return {"answer": "Please provide a question to answer.", "sources": []}

    try:
        docs = document_retriever(question)
    except Exception as rag_error:
        print(f"[agent] RAG unavailable, answering without documents: {type(rag_error).__name__}: {rag_error}")
        docs = []
    web_results = web_search(question)

    providers = build_llms()
    if not providers:
        answer = "I could not access a live LLM because no Groq or Gemini API key is configured. Based on the local indexed documents and web results available to the system, the most relevant material should be reviewed in the source list below."
        if docs:
            first = docs[0]
            answer = (
                f"I do not have a configured LLM key in this environment, so I can only provide a local retrieval summary. "
                f"The strongest match is: {first.get('title', 'Document')} (page {first.get('page', 'n/a')}). "
                f"Please review the local source material for the most specific answer."
            )
        return {"answer": answer, "sources": _format_sources(docs, web_results)}

    context_parts: list[str] = []

    if docs:
        context_parts.append("Relevant local documents:")
        for item in docs[:5]:
            segment = item.get("content", "").strip().replace("\n", " ")
            context_parts.append(
                f"- {item.get('title', 'Document')} (page {item.get('page', 'n/a')}): {segment[:1200]}"
            )

    if web_results:
        context_parts.append("Relevant web results:")
        for item in web_results[:5]:
            context_parts.append(
                f"- {item.get('title', 'Web result')} ({item.get('url', '')}): {item.get('snippet', '')[:600]}"
            )

    prompt = f"{SYSTEM_PROMPT}\n\nQuestion: {question}\n\nContext:\n{chr(10).join(context_parts) if context_parts else 'No contextual material found.'}\n\nAnswer concisely and cite the most relevant sources in-line or at the end."
    raw_response = invoke_with_fallback(prompt, providers)
    answer = getattr(raw_response, "content", str(raw_response))

    return {"answer": answer, "sources": _format_sources(docs, web_results)}
