import logging
import os
from typing import Any

from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from knowledge_base import search_documents

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a warm, helpful assistant for Glorious Restoration Embassy, a church in Kenya. "
    "Answer questions in a friendly, pastoral tone. "
    "Be BRIEF: 1-3 short paragraphs maximum, or a short list if the user asked for one. "
    "Do NOT cite historical sources like Josephus, Tacitus, or academic references unless explicitly asked. "
    "Do NOT write a bibliography. Do NOT use academic jargon. "
    "If you don't know something, say so simply. "
    "For sensitive topics (grief, crisis, abuse), gently encourage the user to speak with a pastor directly."
)

MAX_TOKENS = 400
TEMPERATURE = 0.4
RAG_LIMIT = 4


def document_retriever(query: str) -> list[dict[str, Any]]:
    try:
        return search_documents(query, limit=RAG_LIMIT)
    except Exception as error:
        logger.warning("RAG retrieval failed: %s", error)
        return []


def web_search(query: str) -> list[dict[str, Any]]:
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
    except Exception:
        return []

    return [
        {
            "title": r.get("title") or "Web result",
            "url": r.get("href") or r.get("url") or "",
            "snippet": (r.get("body") or "")[:400],
        }
        for r in results
        if r.get("href") or r.get("url")
    ]


def build_llms() -> list[tuple[str, Any]]:
    providers: list[tuple[str, Any]] = []

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            providers.append((
                "Groq",
                ChatGroq(
                    model="llama-3.1-8b-instant",
                    api_key=groq_key,
                    temperature=TEMPERATURE,
                    max_tokens=MAX_TOKENS,
                ),
            ))
        except Exception as e:
            logger.warning("Groq init failed: %s", e)

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            providers.append((
                "Gemini",
                ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash",
                    api_key=gemini_key,
                    temperature=TEMPERATURE,
                    max_output_tokens=MAX_TOKENS,
                ),
            ))
        except Exception as e:
            logger.warning("Gemini init failed: %s", e)

    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    if deepseek_key:
        try:
            from langchain_openai import ChatOpenAI
            providers.append((
                "DeepSeek",
                ChatOpenAI(
                    model="deepseek-chat",
                    api_key=deepseek_key,
                    base_url="https://api.deepseek.com/v1",
                    temperature=TEMPERATURE,
                    max_tokens=MAX_TOKENS,
                ),
            ))
        except Exception as e:
            logger.warning("DeepSeek init failed: %s", e)

    return providers


def invoke_with_fallback(messages: list, providers: list[tuple[str, Any]]) -> Any:
    last_error: Exception | None = None
    for name, provider in providers:
        try:
            return provider.invoke(messages)
        except Exception as error:
            last_error = error
            logger.warning("%s failed (%s); trying next.", name, type(error).__name__)
    if last_error:
        raise RuntimeError("All configured AI providers failed.") from None
    raise RuntimeError("No AI providers are configured.")


def _format_sources(docs, web_results) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in docs:
        url = item.get("url") or ""
        if url and url not in seen:
            seen.add(url)
            sources.append({"title": item.get("title") or "Document", "url": url, "type": "document"})
    for r in web_results:
        url = (r.get("url") or "").strip()
        if url and url not in seen:
            seen.add(url)
            sources.append({"title": r.get("title") or "Web result", "url": url, "type": "web"})
    return sources[:5]


def answer_question(question: str, history: list | None = None) -> dict[str, Any]:
    question = (question or "").strip()
    if not question:
        return {"answer": "Please ask a question.", "sources": []}

    docs = document_retriever(question)
    web_results = web_search(question) if not docs else []

    providers = build_llms()
    if not providers:
        return {
            "answer": (
                "I'm temporarily unable to reach the AI service. "
                "Please try again in a moment, or contact the church office directly."
            ),
            "sources": _format_sources(docs, web_results),
        }

    context_parts: list[str] = []
    if docs:
        context_parts.append("Church documents:")
        for item in docs[:RAG_LIMIT]:
            segment = (item.get("content") or "").strip().replace("\n", " ")[:800]
            context_parts.append(f"- {item.get('title', 'Document')}: {segment}")
    if web_results:
        context_parts.append("Web context:")
        for r in web_results:
            context_parts.append(f"- {r['title']}: {r['snippet']}")

    context = "\n".join(context_parts) if context_parts else "No local context found."

    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    if history:
        for turn in history[-6:]:
            role = turn.get("role") if isinstance(turn, dict) else None
            content = turn.get("content") if isinstance(turn, dict) else None
            if role == "user" and content:
                messages.append(HumanMessage(content=content))
            elif role == "assistant" and content:
                messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=f"Question: {question}\n\nContext:\n{context}\n\nAnswer warmly and briefly."))

    raw = invoke_with_fallback(messages, providers)
    answer = getattr(raw, "content", str(raw))

    return {"answer": answer, "sources": _format_sources(docs, web_results)}
