# Glorious Restoration Embassy API

FastAPI service for the church's document-backed research assistant. It exposes
`GET /health`, `POST /api/chat`, and `POST /api/ingest`. At startup, it reads
PDFs recursively from `content/documents/` in `GITHUB_REPO` and rebuilds the
vector index using `BAAI/bge-small-en-v1.5`.

The daily limit of 10 admitted chat request attempts is enforced by the
authenticated website's Next.js `POST /api/chat` route using Supabase and the
Africa/Nairobi calendar day. Attempts count when admitted, whether FastAPI
succeeds or fails. FastAPI's shared `POST /api/chat` endpoint remains unchanged
so Telegram can continue to use the same assistant and knowledge base without
consuming website-user quota.

## Local setup

From this directory, create and activate a virtual environment, then install
the dependencies:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` with your provider keys as needed. Groq is the preferred runtime
provider; if its client cannot initialize or an invocation fails, the assistant
tries Gemini. Configure both `GROQ_API_KEY` and `GEMINI_API_KEY` to enable that
fallback. Set `FRONTEND_URL` to the
frontend origin; multiple comma-separated origins are supported. Provider keys
are not needed for the health endpoint. Set `INGEST_API_TOKEN` to a long,
random secret before enabling PDF ingestion; the ingest route rejects requests
without its bearer token and is disabled when the setting is absent. For local
development, set `VECTRIX_PERSIST_DIRECTORY=./vectrix_db`. The legacy
`CHROMA_PERSIST_DIRECTORY` setting is also accepted when the Vectrix-specific
setting is not present. The embedding model runs locally; extracted text is
not sent to an embedding API. An empty knowledge collection skips vector search
until it contains indexed documents.

Start the API:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify it at <http://127.0.0.1:8000/health>; the response is
`{"status":"ok"}`. This confirms the API process is responsive; it does not
make a provider request or verify that configured provider credentials are
valid. Test an actual chat request separately when you are ready to use the
configured provider.

## Index PDF sources

Upload one or more text-based PDFs using multipart form data (each PDF is
limited to 25 MiB):

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/ingest `
  -H "Authorization: Bearer $env:INGEST_API_TOKEN" `
  -F "files=@C:\path\to\book.pdf"
```

The endpoint reports page and chunk counts. The Vectrix collection is stored
in `VECTRIX_PERSIST_DIRECTORY` (or the legacy
`CHROMA_PERSIST_DIRECTORY` setting); the PDF originals stay where they are.

## Optional polling Telegram bot

`telegram_bot.py` supports the same shared assistant API as the Cloudflare
Worker. Configure `FASTAPI_BACKEND_URL` to the FastAPI base URL (the legacy
`KOYEB_BACKEND_URL` is also accepted), and ordinary text messages are posted
to `POST /api/chat` as `{ "question": "..." }`. The reply includes available
source links.

For CMS access, `content/admins.json` may contain a GitHub `super_admin`
username and an `admins` list of numeric Telegram IDs. A GitHub username is
not a Telegram identity: explicitly map the super-admin to their numeric
Telegram user ID with the runtime `SUPER_ADMIN_TELEGRAM_ID` environment
variable. Existing numeric IDs in `admins` remain authorized. Keep this
mapping in the deployment environment or an ignored local `.env`, never in
committed source/config.

To index the six books in `C:\Users\<you>\Downloads`, run:

```powershell
python ingest_sources.py
```

The script checks that all six PDFs exist before processing, then prints the
page and chunk counts and total collection size.

## Deploy to Koyeb

Create a Web Service from the repository and set its working directory to
`backend`. Use the Python build command:

```sh
pip install -r requirements.txt
```

Use this run command so the service binds to Koyeb's assigned port:

```sh
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Set these Koyeb environment variables:

- `GITHUB_REPO=owner/repository`
- `GITHUB_TOKEN` with read access to the private repository, if applicable
- `CHROMA_PERSIST_DIRECTORY=/tmp/chroma_db`
- - `GROQ_API_KEY` and `GEMINI_API_KEY` (Gemini is the runtime fallback for Groq)
- `FRONTEND_URL` to the deployed Vercel origin

Place source PDFs in `content/documents/` in the GitHub repository. The backend
rebuilds the index at each startup; a restart after inactivity incurs the
embedding/download startup cost again because `/tmp` is ephemeral. If GitHub
indexing fails, the error is logged and the API still starts so `/health`
remains available; inspect Koyeb logs to resolve the indexing failure.
