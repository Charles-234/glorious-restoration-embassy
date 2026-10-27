import json
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import telegram_bot


class FakeAssistantResponse:
    status_code = 200

    def raise_for_status(self):
        return None

    def json(self):
        return {
            "answer": "A shared RAG answer.",
            "sources": [{"title": "Reference", "url": "https://example.test/ref"}],
        }


class FakeAsyncClient:
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.request = None
        self.request_headers = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False

    async def post(self, url, *, json, headers):
        self.request = (url, json)
        self.request_headers = headers
        return FakeAssistantResponse()


class TelegramBotIntegrationTests(unittest.IsolatedAsyncioTestCase):
    def test_admins_file_and_explicit_super_admin_mapping(self):
        with tempfile.TemporaryDirectory() as directory:
            admins_file = Path(directory) / "admins.json"
            admins_file.write_text(
                json.dumps({"super_admin": "Charles-234", "admins": [12345]}),
                encoding="utf-8",
            )
            with (
                patch.object(telegram_bot, "ADMINS_PATH", admins_file),
                patch.dict(os.environ, {}, clear=False),
            ):
                os.environ.pop("SUPER_ADMIN_TELEGRAM_ID", None)
                self.assertTrue(telegram_bot.is_admin(12345))
                self.assertFalse(telegram_bot.is_admin(67890))
                # The GitHub username is deliberately not interpreted as a Telegram ID.
                self.assertFalse(telegram_bot.is_admin(234))

                os.environ["SUPER_ADMIN_TELEGRAM_ID"] = "67890"
                self.assertTrue(telegram_bot.is_admin(67890))

    async def test_backend_bot_uses_shared_fastapi_chat_endpoint(self):
        client = FakeAsyncClient()
        with (
            patch.dict(
                os.environ,
                {
                    "FASTAPI_BACKEND_URL": "https://fastapi.example.test/",
                    "CHAT_BACKEND_SHARED_SECRET": "test-chat-secret",
                },
                clear=False,
            ),
            patch.object(telegram_bot.httpx, "AsyncClient", return_value=client) as client_factory,
        ):
            result = await telegram_bot.request_assistant_answer("What is the answer?")

        self.assertEqual(
            client.request,
            (
                "https://fastapi.example.test/api/chat",
                {"question": "What is the answer?"},
            ),
        )
        self.assertEqual(client.request_headers, {"Authorization": "Bearer test-chat-secret"})
        self.assertEqual(
            telegram_bot.format_assistant_reply(result),
            "A shared RAG answer.\n\nSources:\n- Reference: https://example.test/ref",
        )
        client_factory.assert_called_once_with(timeout=25.0)

    async def test_plain_text_message_is_forwarded_to_assistant(self):
        replies = []
        message = SimpleNamespace(
            text="Please explain this passage",
            reply_text=lambda text: self._record_reply(replies, text),
        )
        update = SimpleNamespace(message=message, effective_user=SimpleNamespace(id=8765))

        async def assistant(_question):
            return {
                "answer": "A shared answer.",
                "sources": [{"title": "Text", "url": "https://example.test/text"}],
            }

        with patch.object(telegram_bot, "request_assistant_answer", side_effect=assistant):
            await telegram_bot.handle_text(update, None)

        self.assertEqual(
            replies,
            ["A shared answer.\n\nSources:\n- Text: https://example.test/text"],
        )

    async def test_cms_text_format_remains_admin_only(self):
        replies = []
        message = SimpleNamespace(
            text="Post title === Post body",
            reply_text=lambda text: self._record_reply(replies, text),
        )
        update = SimpleNamespace(message=message, effective_user=SimpleNamespace(id=8765))

        with patch.object(telegram_bot, "is_admin", return_value=False):
            await telegram_bot.handle_text(update, None)

        self.assertEqual(replies, ["Access denied"])

    @staticmethod
    async def _record_reply(replies, text):
        replies.append(text)


if __name__ == "__main__":
    unittest.main()
