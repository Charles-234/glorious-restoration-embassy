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
    def test_groq_uses_models_available_to_the_configured_account_in_order(self):
        with (
            patch.dict(os.environ, {"GROQ_API_KEY": "test"}, clear=True),
            patch.object(
                agent,
                "ChatGroq",
                side_effect=["groq-primary", "groq-backup"],
            ) as groq,
        ):
            self.assertEqual(
                agent.build_llms(),
                [("Groq", "groq-primary"), ("Groq backup", "groq-backup")],
            )

        self.assertEqual(
            [call.kwargs for call in groq.call_args_list],
            [
                {
                    "model": "openai/gpt-oss-120b",
                    "api_key": "test",
                    "temperature": 0.1,
                    "timeout": agent.PROVIDER_TIMEOUT_SECONDS,
                    "max_retries": 0,
                },
                {
                    "model": "openai/gpt-oss-20b",
                    "api_key": "test",
                    "temperature": 0.1,
                    "timeout": agent.PROVIDER_TIMEOUT_SECONDS,
                    "max_retries": 0,
                },
            ],
        )

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

    def test_requested_providers_are_added_only_when_configured(self):
        env = {
            "OMNIROUTE_API_KEY": "omni-key",
            "OMNIROUTE_URL": "https://omni.example/v1",
            "GROQ_API_KEY": "groq-key",
            "GEMINI_API_KEY": "gemini-key",
            "CLOUDFLARE_API_TOKEN": "cloudflare-key",
            "CLOUDFLARE_ACCOUNT_ID": "account",
            "MISTRAL_API_KEY": "mistral-key",
            "CEREBRAS_API_KEY": "cerebras-key",
            "DEEPSEEK_API_KEY": "deepseek-key",
            "NVIDIA_API_KEY": "nvidia-key",
            "OPENROUTER_API_KEY": "openrouter-key",
        }
        with (
            patch.dict(os.environ, env, clear=True),
            patch.object(agent, "ChatGroq", side_effect=["groq-primary", "groq-backup"]),
            patch.object(agent, "ChatGoogleGenerativeAI", return_value="gemini"),
            patch.object(agent, "OpenAICompatibleProvider", side_effect=lambda name, *_args: name),
        ):
            providers = agent.build_llms()

        self.assertEqual(
            [name for name, _provider in providers],
            [
                "OmniRoute",
                "Groq",
                "Gemini",
                "Cloudflare",
                "Groq backup",
                "Mistral",
                "Cerebras",
                "DeepSeek",
                "NVIDIA",
                "OpenRouter",
                "LLM7",
            ],
        )

    def test_openai_compatible_provider_uses_bounded_timeout_and_parses_text(self):
        response = type(
            "Response",
            (),
            {
                "raise_for_status": lambda _self: None,
                "json": lambda _self: {
                    "choices": [{"message": {"content": " Provider answer "}}]
                },
            },
        )()
        provider = agent.OpenAICompatibleProvider(
            "Mistral",
            "mistral-small-latest",
            "https://api.mistral.ai/v1",
            "test-key",
        )
        with patch.object(agent.requests, "post", return_value=response) as post:
            answer = provider.invoke("question")

        self.assertEqual(answer.content, "Provider answer")
        self.assertEqual(post.call_args.kwargs["timeout"], agent.PROVIDER_TIMEOUT_SECONDS)
        self.assertEqual(
            post.call_args.kwargs["headers"]["Authorization"],
            "Bearer test-key",
        )

    def test_openai_compatible_provider_rejects_empty_response(self):
        response = type(
            "Response",
            (),
            {
                "raise_for_status": lambda _self: None,
                "json": lambda _self: {"choices": [{"message": {"content": " "}}]},
            },
        )()
        provider = agent.OpenAICompatibleProvider(
            "Mistral",
            "mistral-small-latest",
            "https://api.mistral.ai/v1",
            "test-key",
        )
        with (
            patch.object(agent.requests, "post", return_value=response),
            self.assertRaisesRegex(ValueError, "empty or invalid response"),
        ):
            provider.invoke("question")


if __name__ == "__main__":
    unittest.main()
