import os
import unittest
from unittest.mock import patch

import agent


class FailingProvider:
    def invoke(self, _prompt):
        raise RuntimeError("provider unavailable")


class SuccessfulProvider:
    def invoke(self, prompt):
        self.prompt = prompt
        return type("Response", (), {"content": "Gemini response"})()


class ProviderFallbackTests(unittest.TestCase):
    def test_gemini_is_invoked_after_groq_runtime_failure(self):
        gemini = SuccessfulProvider()
        result = agent.invoke_with_fallback(
            "test prompt",
            [("Groq", FailingProvider()), ("Gemini", gemini)],
        )

        self.assertEqual(result.content, "Gemini response")
        self.assertEqual(gemini.prompt, "test prompt")

    def test_all_runtime_failures_raise_a_stable_error(self):
        with self.assertRaisesRegex(RuntimeError, "All configured AI providers failed"):
            agent.invoke_with_fallback(
                "test prompt",
                [("Groq", FailingProvider()), ("Gemini", FailingProvider())],
            )

    def test_groq_constructor_failure_still_initializes_gemini(self):
        with (
            patch.dict(os.environ, {"GROQ_API_KEY": "test", "GEMINI_API_KEY": "test"}),
            patch.object(agent, "ChatGroq", side_effect=RuntimeError("invalid Groq setup")),
            patch.object(agent, "ChatGoogleGenerativeAI", return_value="gemini-client") as gemini,
        ):
            self.assertEqual(agent.build_llms(), [("Gemini", "gemini-client")])

        gemini.assert_called_once()


if __name__ == "__main__":
    unittest.main()
