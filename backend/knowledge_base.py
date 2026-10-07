"""
knowledge_base.py — Document ingestion and retrieval using VectrixDB.

VectrixDB is a free, local vector database with embedded ML models.
No API keys required. Uses bundled English models (~386MB).

Reference: https://pypi.org/project/vectrixdb/ [citation:1]
"""

import hashlib
import logging
import os
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse
from io import BytesIO

import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from vectrixdb import Vectrix

COLLECTION_NAME = "church_documents"
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200
UPSERT_BATCH_SIZE = 64
PAGE_PROGRESS_INTERVAL = 100
MAX_GITHUB_PDF_SIZE_BYTES = 25 * 1024 * 1024
GITHUB_API = "https://api.github.com"

logger = logging.getLogger(__name__)

# Global database instance (lazy-loaded)
_db: Vectrix | None = None


def get_db() -> Vectrix:
    """Get or create the VectrixDB instance."""
    global _db
    if _db is None:
        persist_dir = Path(
            os.getenv("VECTRIX_PERSIST_DIRECTORY")
            or os.getenv("CHROMA_PERSIST_DIRECTORY")
            or str(Path(__file__).with_name("vectrix_db"))
        )
        persist_dir.mkdir(parents=True, exist_ok=True)

        # Use hybrid search for balanced vector and keyword retrieval.
        _db = Vectrix(
            name=COLLECTION_NAME,
            path=str(persist_dir),
            mode="hybrid",
            language="en",
        )
        logger.info("VectrixDB initialized at %s", persist_dir)
    return _db


def reset_collection() -> None:
    """Reset the VectrixDB document collection."""
    get_db().clear()
    logger.info("VectrixDB collection reset.")


def search_documents(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Search the document collection and return matching chunks."""
    db = get_db()
    if db.count() == 0:
        return []

    results = db.search(query, limit=min(max(limit, 1), 10))

    hits: list[dict[str, Any]] = []
    for hit in results:
        if isinstance(hit, dict):
            text = hit.get("text", "")
            metadata = hit.get("metadata", {})
            score = hit.get("score", 0.0)
        else:
            text = getattr(hit, "text", "")
            metadata = getattr(hit, "metadata", {})
            score = getattr(hit, "score", 0.0)

        if not text:
            continue
        if not isinstance(metadata, dict):
            metadata = {}

        source = metadata.get("source", "unknown.pdf")
        hits.append(
            {
                "content": text,
                "source": source,
                "title": metadata.get("title", Path(source).stem),
                "page": metadata.get("page"),
                "distance": 1.0 - score if isinstance(score, (int, float)) else 1.0,
                "url": metadata.get("url") or f"file://{source}",
            }
        )
    return hits


def ingest_pdf(
    filename: str,
    content: bytes,
    source_url: str | None = None,
) -> dict[str, object]:
    """Parse a PDF, split it into chunks, and add them to VectrixDB."""
    try:
        reader = PdfReader(BytesIO(content), strict=False)
    except Exception as error:
        raise ValueError(f"Could not read {filename} as a PDF.") from error

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
    )
    file_hash = hashlib.sha256(
        filename.encode("utf-8") + b"\0" + content
    ).hexdigest()
    total_pages = len(reader.pages)
    text_pages = 0
    total_chunks = 0
    page_number = 0
    pending_texts: list[str] = []
    pending_metadatas: list[dict] = []
    db = get_db()

    def add_batch(texts: list[str], metadatas: list[dict]) -> None:
        nonlocal total_chunks
        ids = [
            hashlib.sha256(
                f"{file_hash}:{total_chunks + index}".encode("utf-8")
            ).hexdigest()
            for index in range(len(texts))
        ]
        db.add(texts=texts, metadata=metadatas, ids=ids)
        total_chunks += len(texts)
        print(
            f"Indexed {total_chunks} chunks from {filename} "
            f"(through page {metadatas[-1].get('page', '?')}).",
            flush=True,
        )

    try:
        for page_number, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                text_pages += 1
                chunks = splitter.create_documents(
                    [text],
                    metadatas=[{"source": filename, "page": page_number}],
                )
                for chunk in chunks:
                    pending_texts.append(chunk.page_content)
                    pending_metadatas.append(
                        {
                            **chunk.metadata,
                            "source": filename,
                            "title": Path(filename).stem,
                            "chunk": total_chunks + len(pending_texts) - 1,
                            **({"url": source_url} if source_url else {}),
                        }
                    )

                # Flush when batch is full
                while len(pending_texts) >= UPSERT_BATCH_SIZE:
                    add_batch(
                        pending_texts[:UPSERT_BATCH_SIZE],
                        pending_metadatas[:UPSERT_BATCH_SIZE],
                    )
                    del pending_texts[:UPSERT_BATCH_SIZE]
                    del pending_metadatas[:UPSERT_BATCH_SIZE]

            if page_number % PAGE_PROGRESS_INTERVAL == 0:
                print(
                    f"Extracted {page_number}/{total_pages} pages from {filename}.",
                    flush=True,
                )
    except Exception as error:
        raise ValueError(
            f"Could not extract text from page {page_number} of {filename}."
        ) from error

    # Flush remaining
    if pending_texts:
        add_batch(pending_texts, pending_metadatas)

    if text_pages == 0:
        raise ValueError(f"No extractable text was found in {filename}.")
    if total_chunks == 0:
        raise ValueError(f"No text chunks could be created from {filename}.")

    return {
        "source": filename,
        "pages": total_pages,
        "text_pages": text_pages,
        "chunks": total_chunks,
    }


def ingest_github_documents() -> list[dict[str, object]]:
    """Fetch PDFs from GitHub and rebuild the VectrixDB index."""
    repo_name = os.getenv("GITHUB_REPO", "").strip()
    if not repo_name:
        logger.warning(
            "GITHUB_REPO is not configured; skipping startup document rebuild."
        )
        return []

    repo_parts = repo_name.split("/")
    if len(repo_parts) != 2 or not all(repo_parts):
        raise ValueError("GITHUB_REPO must use the owner/repository format.")
    owner, repository = repo_parts

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "glorious-restoration-embassy-api",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    def list_pdfs(path: str) -> list[str]:
        encoded_path = quote(path, safe="/")
        response = requests.get(
            f"{GITHUB_API}/repos/{quote(owner)}/{quote(repository)}/contents/{encoded_path}",
            headers=headers,
            timeout=30,
        )
        if response.status_code == 404 and path == "content/documents":
            return []
        response.raise_for_status()
        entries = response.json()
        if not isinstance(entries, list):
            raise ValueError(f"Expected a GitHub directory listing for {path}.")

        paths: list[str] = []
        for entry in entries:
            entry_path = entry.get("path")
            entry_type = entry.get("type")
            if not isinstance(entry_path, str):
                continue
            if entry_type == "dir":
                paths.extend(list_pdfs(entry_path))
            elif entry_type == "file" and entry_path.lower().endswith(".pdf"):
                paths.append(entry_path)
        return paths

    pdf_paths = list_pdfs("content/documents")
    reset_collection()
    if not pdf_paths:
        logger.info("No PDF files found in %s/content/documents.", repo_name)
        return []

    results: list[dict[str, object]] = []
    for pdf_path in pdf_paths:
        encoded_path = quote(pdf_path, safe="/")
        with requests.get(
            f"{GITHUB_API}/repos/{quote(owner)}/{quote(repository)}/contents/{encoded_path}",
            headers={
                **headers,
                "Accept": "application/vnd.github.raw+json",
            },
            timeout=60,
            stream=True,
        ) as response:
            response.raise_for_status()
            content = bytearray()
            for chunk in response.iter_content(chunk_size=64 * 1024):
                if not chunk:
                    continue
                content.extend(chunk)
                if len(content) > MAX_GITHUB_PDF_SIZE_BYTES:
                    raise ValueError(
                        f"{pdf_path} exceeds the 25 MiB GitHub PDF limit."
                    )

        result = ingest_pdf(
            pdf_path,
            bytes(content),
            source_url=f"https://github.com/{repo_name}/blob/HEAD/{encoded_path}",
        )
        results.append(result)
        logger.info(
            "Rebuilt document index from %s (%s chunks).",
            pdf_path,
            result["chunks"],
        )
    return results


def ingest_url(url: str) -> dict[str, object]:
    """Download a PDF from a URL and ingest it."""
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    filename = Path(urlparse(url).path).name or "download.pdf"
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"
    return ingest_pdf(filename, response.content)