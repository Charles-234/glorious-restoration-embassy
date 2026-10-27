import unittest

from main import is_bearer_token_authorized, is_ingest_authorized


class IngestAuthorizationTests(unittest.TestCase):
    def test_requires_configured_token(self):
        self.assertFalse(is_ingest_authorized("Bearer secret", None))

    def test_accepts_matching_bearer_token(self):
        self.assertTrue(is_ingest_authorized("Bearer secret", "secret"))

    def test_rejects_missing_or_incorrect_token(self):
        self.assertFalse(is_ingest_authorized(None, "secret"))
        self.assertFalse(is_ingest_authorized("Bearer wrong", "secret"))
        self.assertFalse(is_ingest_authorized("Basic secret", "secret"))

    def test_shared_bearer_auth_requires_matching_configured_token(self):
        self.assertTrue(is_bearer_token_authorized("Bearer secret", "secret"))
        self.assertFalse(is_bearer_token_authorized(None, "secret"))
        self.assertFalse(is_bearer_token_authorized("Bearer wrong", "secret"))
        self.assertFalse(is_bearer_token_authorized("Bearer secret", None))


if __name__ == "__main__":
    unittest.main()
