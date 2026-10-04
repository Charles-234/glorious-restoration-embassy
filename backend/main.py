import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
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


@app.post("/api/ingest")
async def ingest(files: list[UploadFile] = File(...)) -> dict[str, object]:
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
async def chat(payload: dict[str, str]) -> dict[str, object]:
    question = (payload or {}).get("question") or (payload or {}).get("query") or ""
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is required.")

    result = await run_in_threadpool(answer_question, question)
    return result
