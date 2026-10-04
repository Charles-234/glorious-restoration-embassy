import hashlib
import logging
import os
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

import chromadb
import requests
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

COLLECTION_NAME = "church_documents"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200
UPSERT_BATCH_SIZE = 64
PAGE_PROGRESS_INTERVAL = 100
MAX_GITHUB_PDF_SIZE_BYTES = 25 * 1024 * 1024
GITHUB_API = "https://api.github.com"
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_collection() -> Any:
    persist_directory = Path(
        os.getenv(
            "CHROMA_PERSIST_DIRECTORY",
            str(Path(__file__).with_name("chroma_db")),
        )
    )
    persist_directory.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(persist_directory))
    embedding_function = SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL,
        device="cpu",
    )
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"},
    )


def reset_collection() -> None:
    persist_directory = Path(
        os.getenv(
            "CHROMA_PERSIST_DIRECTORY",
            str(Path(__file__).with_name("chroma_db")),
        )
    )
    persist_directory.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(persist_directory))
    collections = client.list_collections()
    collection_names = {
        collection if isinstance(collection, str) else collection.name
        for collection in collections
    }
    if COLLECTION_NAME in collection_names:
        client.delete_collection(COLLECTION_NAME)
    get_collection.cache_clear()


def search_documents(query: str, limit: int = 5) -> list[dict[str, Any]]:
    collection = get_collection()
    if collection.count() == 0:
        return []
    results = collection.query(
        query_texts=[query],
        n_results=min(max(limit, 1), 10),
        include=["documents", "metadatas", "distances"],
    )

    docs = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    hits: list[dict[str, Any]] = []
    for document, metadata, distance in zip(docs, metadatas, distances):
        if not document:
            continue
        hits.append(
            {
                "content": document,
                "source": metadata.get("source", "unknown.pdf"),
                "title": metadata.get("title", Path(metadata.get("source", "unknown.pdf")).stem),
                "page": metadata.get("page"),
                "distance": distance,
                "url": metadata.get("url") or f"file://{metadata.get('source', 'unknown.pdf')}",
            }
        )
    return hits


def ingest_pdf(
    filename: str,
    content: bytes,
    source_url: str | None = None,
) -> dict[str, object]:
    try:
        reader = PdfReader(BytesIO(content), strict=False)
    except Exception as error:
        raise ValueError(f"Could not read {filename} as a PDF.") from error

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
    )
    file_hash = hashlib.sha256(filename.encode("utf-8") + b"\0" + content).hexdigest()
    total_pages = len(reader.pages)
    text_pages = 0
    total_chunks = 0
    page_number = 0
    pending_chunks = []
    collection = None

    def upsert_batch(batch: list[Any]) -> None:
        nonlocal collection, total_chunks
        if collection is None:
            print("Loading local embedding model...", flush=True)
            collection = get_collection()

        ids = [
            hashlib.sha256(
                f"{file_hash}:{total_chunks + index}".encode("utf-8")
            ).hexdigest()
            for index in range(len(batch))
        ]
        collection.upsert(
            ids=ids,
            documents=[chunk.page_content for chunk in batch],
            metadatas=[
                {
                    **chunk.metadata,
                    "source": filename,
                    "title": Path(filename).stem,
                    "chunk": total_chunks + index,
                    **({"url": source_url} if source_url else {}),
                }
                for index, chunk in enumerate(batch)
            ],
        )
        total_chunks += len(batch)
        print(
            f"Indexed {total_chunks} chunks from {filename} "
            f"(through page {batch[-1].metadata['page']}).",
            flush=True,
        )

    try:
        for page_number, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                text_pages += 1
                pending_chunks.extend(
                    splitter.create_documents(
                        [text],
                        metadatas=[{"source": filename, "page": page_number}],
                    )
                )
                while len(pending_chunks) >= UPSERT_BATCH_SIZE:
                    upsert_batch(pending_chunks[:UPSERT_BATCH_SIZE])
                    del pending_chunks[:UPSERT_BATCH_SIZE]

            if page_number % PAGE_PROGRESS_INTERVAL == 0:
                print(
                    f"Extracted {page_number}/{total_pages} pages from {filename}.",
                    flush=True,
                )
    except Exception as error:
        raise ValueError(
            f"Could not extract text from page {page_number} of {filename}."
        ) from error

    if pending_chunks:
        upsert_batch(pending_chunks)

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
    repo_name = os.getenv("GITHUB_REPO", "").strip()
    if not repo_name:
        logger.warning("GITHUB_REPO is not configured; skipping startup document rebuild.")
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
                    raise ValueError(f"{pdf_path} exceeds the 25 MiB GitHub PDF limit.")

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
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    filename = Path(urlparse(url).path).name or "download.pdf"
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"
    return ingest_pdf(filename, response.content)
