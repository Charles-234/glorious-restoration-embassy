import hmac
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from agent import answer_question
from knowledge_base import ingest_github_documents, ingest_pdf

load_dotenv(Path(__file__).with_name(".env"))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if os.getenv("GITHUB_REPO"):
        try:
            results = await run_in_threadpool(ingest_github_documents)
            logger.info("Startup document rebuild completed for %s PDF(s).", len(results))
        except Exception:
            logger.exception("Startup document rebuild failed; the API will still start.")
    else:
        logger.warning("GITHUB_REPO is not configured; startup document rebuild was skipped.")
    yield

MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024


def is_bearer_token_authorized(authorization: str | None, expected_token: str | None) -> bool:
    if not expected_token or not authorization:
        return False
    scheme, separator, supplied_token = authorization.partition(" ")
    return (
        separator == " "
        and scheme.lower() == "bearer"
        and hmac.compare_digest(supplied_token, expected_token)
    )


def is_ingest_authorized(authorization: str | None, expected_token: str | None) -> bool:
    return is_bearer_token_authorized(authorization, expected_token)


frontend_urls = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000,http://localhost:3001",
)
allowed_origins = [
    origin.strip()
    for origin in frontend_urls.split(",")
    if origin.strip()
]

app = FastAPI(title="Glorious Restoration Embassy API", lifespan=lifespan)


@app.get("/")
@app.head("/")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/rag")
async def health_rag() -> dict[str, object]:
    try:
        from knowledge_base import get_db

        db = get_db()
        count = db.count()
        return {"rag": "ok", "collection": "church_documents", "documents": count}
    except Exception as error:
        logger.exception("RAG health check failed.")
        return {
            "rag": "error",
            "message": "Document search is temporarily unavailable.",
        }


@app.post("/api/ingest")
async def ingest(
    files: list[UploadFile] = File(...),
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    expected_token = os.getenv("INGEST_API_TOKEN")
    if not expected_token:
        logger.error("Document ingestion is disabled because INGEST_API_TOKEN is not configured.")
        raise HTTPException(
            status_code=503,
            detail="Document ingestion is temporarily unavailable.",
        )
    if not is_ingest_authorized(authorization, expected_token):
        raise HTTPException(status_code=401, detail="Authentication required.")

    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one PDF.")

    results = []
    for file in files:
        filename = file.filename or "upload.pdf"
        if Path(filename).suffix.lower() != ".pdf":
            raise HTTPException(
                status_code=415,
                detail=f"{filename} is not a PDF file.",
            )

        content = await file.read(MAX_PDF_SIZE_BYTES + 1)
        if len(content) > MAX_PDF_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"{filename} exceeds the 25 MiB upload limit.",
            )

        try:
            result = await run_in_threadpool(ingest_pdf, filename, content)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error

        results.append(result)

    return {"status": "ok", "files": results}


@app.post("/api/chat")
async def chat(
    payload: dict,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    expected_token = os.getenv("CHAT_BACKEND_SHARED_SECRET")
    if not expected_token:
        logger.error("Chat is disabled because CHAT_BACKEND_SHARED_SECRET is not configured.")
        raise HTTPException(
            status_code=503,
            detail="The AI assistant is temporarily unavailable.",
        )
    if not is_bearer_token_authorized(authorization, expected_token):
        raise HTTPException(status_code=401, detail="Authentication required.")

    question = (payload or {}).get("question") or (payload or {}).get("query") or ""
    history = (payload or {}).get("history") or []
    logger.info("[chat] Received question=%r history_len=%d", question[:60], len(history) if isinstance(history, list) else -1)
    if not isinstance(history, list):
        history = []
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is required.")

    try:
        result = await run_in_threadpool(answer_question, question, history)
    except Exception as error:
        logger.exception("Chat answer generation failed.")
        raise HTTPException(
            status_code=502,
            detail="The AI assistant is temporarily unavailable. Please try again later.",
        ) from error
    return result
