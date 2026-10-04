import json
from pathlib import Path

from knowledge_base import get_collection, ingest_pdf


SOURCE_FILES = [
    "Volume 1 of The Poem of The Man-God.pdf",
    "Volume 2 of The Poem of The Man-God.pdf",
    "Volume 3 of The Poem of The Man-God.pdf",
    "Volume 4 of The Poem of The Man-God.pdf",
    "Volume 5 of The Poem of The Man-God.pdf",
    "Digital_Ethipian_Bible_(pdf).pdf",
]


def main() -> None:
    downloads = Path.home() / "Downloads"
    missing = [name for name in SOURCE_FILES if not (downloads / name).is_file()]
    if missing:
        raise FileNotFoundError(
            "Missing PDF source files in Downloads: " + ", ".join(missing)
        )

    results = []
    for filename in SOURCE_FILES:
        path = downloads / filename
        print(f"Indexing {filename}...", flush=True)
        results.append(ingest_pdf(filename, path.read_bytes()))

    print(json.dumps({
        "sources": results,
        "total_sources": len(results),
        "total_pages": sum(int(result["pages"]) for result in results),
        "total_text_pages": sum(int(result["text_pages"]) for result in results),
        "total_chunks": sum(int(result["chunks"]) for result in results),
        "collection_documents": get_collection().count(),
    }, indent=2))


if __name__ == "__main__":
    main()
