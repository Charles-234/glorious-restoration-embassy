import os
import unittest
from unittest.mock import patch

import knowledge_base


class FakeResponse:
    def __init__(self, payload=None, content=b""):
        self.status_code = 200
        self._payload = payload
        self._content = content

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None

    def iter_content(self, chunk_size):
        yield self._content

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


class GithubDocumentIngestionTests(unittest.TestCase):
    def test_rebuild_recurses_into_document_directories(self):
        directory_listing = FakeResponse(
            [{"type": "dir", "path": "content/documents/history"}]
        )
        nested_listing = FakeResponse(
            [{"type": "file", "path": "content/documents/history/sample.pdf"}]
        )
        pdf_response = FakeResponse(content=b"%PDF-sample")
        requests = [directory_listing, nested_listing, pdf_response]
        ingested = []

        def get_request(*_args, **_kwargs):
            return requests.pop(0)

        def ingest_pdf(filename, content, source_url=None):
            ingested.append((filename, content, source_url))
            return {"source": filename, "chunks": 1}

        with (
            patch.dict(
                os.environ,
                {"GITHUB_REPO": "church/site", "GITHUB_TOKEN": "test-token"},
                clear=False,
            ),
            patch.object(knowledge_base.requests, "get", side_effect=get_request),
            patch.object(knowledge_base, "reset_collection") as reset_collection,
            patch.object(knowledge_base, "ingest_pdf", side_effect=ingest_pdf),
        ):
            results = knowledge_base.ingest_github_documents()

        reset_collection.assert_called_once_with()
        self.assertEqual(results, [{"source": "content/documents/history/sample.pdf", "chunks": 1}])
        self.assertEqual(
            ingested,
            [
                (
                    "content/documents/history/sample.pdf",
                    b"%PDF-sample",
                    "https://github.com/church/site/blob/HEAD/content/documents/history/sample.pdf",
                )
            ],
        )


if __name__ == "__main__":
    unittest.main()
