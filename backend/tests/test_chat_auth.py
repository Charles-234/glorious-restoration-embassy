import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

import main


class ChatAuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_chat_rejects_missing_or_invalid_service_credentials(self):
        with patch.dict(os.environ, {"CHAT_BACKEND_SHARED_SECRET": "expected"}, clear=False):
            without_credentials = self.client.post(
                "/api/chat",
                json={"question": "A test question"},
            )
            with_invalid_credentials = self.client.post(
                "/api/chat",
                json={"question": "A test question"},
                headers={"Authorization": "Bearer incorrect"},
            )

        self.assertEqual(without_credentials.status_code, 401)
        self.assertEqual(with_invalid_credentials.status_code, 401)

    def test_chat_is_disabled_when_shared_secret_is_missing(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("CHAT_BACKEND_SHARED_SECRET", None)
            response = self.client.post(
                "/api/chat",
                json={"question": "A test question"},
                headers={"Authorization": "Bearer any-token"},
            )

        self.assertEqual(response.status_code, 503)

    def test_chat_accepts_service_credentials(self):
        with (
            patch.dict(os.environ, {"CHAT_BACKEND_SHARED_SECRET": "expected"}, clear=False),
            patch.object(main, "answer_question", return_value={"answer": "A safe test response"}),
        ):
            response = self.client.post(
                "/api/chat",
                json={"question": "A test question"},
                headers={"Authorization": "Bearer expected"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"answer": "A safe test response"})


if __name__ == "__main__":
    unittest.main()
