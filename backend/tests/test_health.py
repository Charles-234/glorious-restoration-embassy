import unittest

from fastapi.testclient import TestClient

from main import app


class HealthCheckTests(unittest.TestCase):
    def test_root_get_returns_ok(self):
        with TestClient(app) as client:
            response = client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_root_head_returns_ok_without_body(self):
        with TestClient(app) as client:
            response = client.head("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"")


if __name__ == "__main__":
    unittest.main()
