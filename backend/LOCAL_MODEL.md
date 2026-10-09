# Local Bible Model Setup

The backend uses a local Bible assistant model as the 4th fallback provider
(after OmniRoute, Groq, Gemini, Cloudflare, etc.). It runs inside the same
Codespace as the backend.

## Model

- Name: `bible-v3.2-q4.gguf` (Timmms/Bible-Assistant-Qwen3.5-4B-v3.2-GGUF)
- Size: ~2.6 GB (Q4_K_M quantization)
- Location: `backend/models/bible-v3.2-q4.gguf` (gitignored)

## Starting the Model Server

Run in a separate terminal from `npm run dev`:

    cd backend
    python -m llama_cpp.server \
      --model models/bible-v3.2-q4.gguf \
      --host 127.0.0.1 --port 8080 \
      --n_ctx 2048 --n_threads 2

Wait for: `Uvicorn running on http://127.0.0.1:8080`

## Redownloading (After a Codespace Rebuild)

    cd backend/models
    curl -L -o bible-v3.2-q4.gguf \
      "https://huggingface.co/Ttimms/Bible-Assistant-Qwen3.5-4B-v3.2-GGUF/resolve/main/bible-v3.2-4b-Q4_K_M.gguf"

## How It's Wired

`backend/agent.py` defines `_add_local_bible_provider()` and calls it as the
last provider in `build_llms()`. The provider uses `OpenAICompatibleProvider`
pointing at `http://127.0.0.1:8080/v1` — llama-cpp-python's server exposes an
OpenAI-compatible API.

If the local model server isn't running, `_add_local_bible_provider` skips
silently (health check failure). Cloud providers are unaffected.
