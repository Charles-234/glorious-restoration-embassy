import logging
import os
from dataclasses import dataclass
from typing import Any

import requests
from duckduckgo_search import DDGS
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

from knowledge_base import search_documents

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are the warm, pastoral AI assistant for Glorious Restoration Embassy, a church in Kenya. "
    "Speak like a caring pastor or elder — kind, encouraging, plain-spoken, never academic. "
    "Answer in 2-4 short sentences (max ~120 words). Do not use bibliographies, formal citations, "
    "or phrases like 'according to Josephus' or 'historically verifiable'. If Scripture fits, quote it "
    "briefly and naturally. If you do not know something, say so gently and point the person to "
    "pastoral help or a church leader. Keep the focus on faith, hope, and practical encouragement."
)
PROVIDER_TIMEOUT_SECONDS = 15


@dataclass
class ChatResponse:
    content: str


class OpenAICompatibleProvider:
    def __init__(
        self,
        name: str,
        model: str,
        base_url: str,
        api_key: str,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.name = name
        self.model = model
        self.url = f"{base_url.rstrip('/')}/chat/completions"
        self.api_key = api_key
        self.headers = headers or {}

    def invoke(self, prompt: str) -> ChatResponse:
        response = requests.post(
            self.url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                **self.headers,
            },
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 400,
            },
            timeout=PROVIDER_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
        choices = payload.get("choices")
        content = (
            choices[0].get("message", {}).get("content")
            if isinstance(choices, list) and choices and isinstance(choices[0], dict)
            else None
        )
        if not isinstance(content, str) or not content.strip():
            raise ValueError(f"{self.name} returned an empty or invalid response.")
        return ChatResponse(content=content.strip())


def _add_openai_provider(
    providers: list[tuple[str, Any]],
    name: str,
    api_key: str | None,
    base_url: str,
    model: str,
    headers: dict[str, str] | None = None,
) -> None:
    if api_key:
        providers.append(
            (name, OpenAICompatibleProvider(name, model, base_url, api_key, headers))
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
    _add_openai_provider(
        providers,
        "OmniRoute",
        os.getenv("OMNIROUTE_API_KEY"),
        os.getenv("OMNIROUTE_URL", ""),
        "groq/openai/gpt-oss-120b",
    )

    groq_key = os.getenv("GROQ_API_KEY")
    groq_backup: tuple[str, Any] | None = None
    if groq_key:
        for index, model in enumerate(
            ("openai/gpt-oss-120b", "openai/gpt-oss-20b")
        ):
            try:
                provider = (
                    "Groq" if index == 0 else "Groq backup",
                    ChatGroq(
                        model=model,
                        api_key=groq_key,
                        temperature=0.1,
                        timeout=PROVIDER_TIMEOUT_SECONDS,
                        max_retries=0,
                    ),
                )
                if index == 0:
                    providers.append(provider)
                else:
                    groq_backup = provider
            except Exception:
                logger.warning(
                    "Could not initialize Groq model %s; trying the next configured model.",
                    model,
                )

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
                        timeout=PROVIDER_TIMEOUT_SECONDS,
                        max_retries=0,
                    ),
                )
            )
        except Exception:
            logger.warning("Could not initialize Gemini.")

    cloudflare_key = os.getenv("CLOUDFLARE_API_TOKEN")
    cloudflare_account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    if cloudflare_key and cloudflare_account_id:
        _add_openai_provider(
            providers,
            "Cloudflare",
            cloudflare_key,
            f"https://api.cloudflare.com/client/v4/accounts/{cloudflare_account_id}/ai/v1",
            "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        )

    if groq_backup:
        providers.append(groq_backup)

    provider_configs = (
        ("Mistral", "MISTRAL_API_KEY", "https://api.mistral.ai/v1", "mistral-small-latest"),
        ("Cerebras", "CEREBRAS_API_KEY", "https://api.cerebras.ai/v1", "llama-3.3-70b"),
        ("DeepSeek", "DEEPSEEK_API_KEY", "https://api.deepseek.com/v1", "deepseek-chat"),
        ("NVIDIA", "NVIDIA_API_KEY", "https://integrate.api.nvidia.com/v1", "meta/llama-3.3-70b-instruct"),
        (
            "OpenRouter",
            "OPENROUTER_API_KEY",
            "https://openrouter.ai/api/v1",
            "meta-llama/llama-3.3-70b-instruct:free",
        ),
    )
    for name, key_name, base_url, model in provider_configs:
        headers = (
            {"HTTP-Referer": "https://gloriousrestorationembassy.org", "X-Title": "Glorious Restoration Embassy"}
            if name == "OpenRouter"
            else None
        )
        _add_openai_provider(
            providers,
            name,
            os.getenv(key_name),
            base_url,
            model,
            headers,
        )

    _add_openai_provider(
        providers,
        "LLM7",
        os.getenv("LLM7_API_KEY", "unused"),
        "https://api.llm7.io/v1",
        "openai/default",
    )

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
    # Only hit the web when the local knowledge base has nothing useful.
    web_results = web_search(question) if not docs else []

    providers = build_llms()
    if not providers:
        answer = "I could not access a live LLM because no provider is configured. Based on the local indexed documents and web results available to the system, the most relevant material should be reviewed in the source list below."
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

    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Question from a visitor: {question}\n\n"
        f"Background you may use (do not quote at length, do not cite formally):\n"
        f"{chr(10).join(context_parts) if context_parts else 'No extra background available.'}\n\n"
        "Reply warmly and briefly, in 2-4 sentences, like a pastor speaking to a friend."
    )
    raw_response = invoke_with_fallback(prompt, providers)
    answer = getattr(raw_response, "content", str(raw_response))

    return {"answer": answer, "sources": _format_sources(docs, web_results)}
