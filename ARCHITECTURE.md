# Hybrid Hosting Architecture

## Services

| Component | Platform | Responsibility |
| --- | --- | --- |
| Website | Vercel | Existing Next.js frontend and public church pages |
| Telegram CMS bot | Cloudflare Workers | grammY webhook, admin checks, GitHub content commits, and AI request proxy |
| AI/RAG API | Koyeb | Existing FastAPI API, document ingestion, retrieval, and chat |
| Content and source PDFs | GitHub repository | Versioned site content and PDFs under `content/documents/` |
| Vector index | Koyeb `/tmp/chroma_db` | Ephemeral Chroma index rebuilt from GitHub PDFs at startup |

The Worker is the Telegram-facing service. It uses the GitHub Contents API to
read `content/admins.json` and publish CMS changes, then forwards non-command
questions to `{KOYEB_BACKEND_URL}/api/chat`. A backend timeout or Koyeb
gateway-unavailable response produces a retry-after-30-seconds message.

Koyeb runs the FastAPI service. On startup it downloads PDFs recursively from
`content/documents/` in `GITHUB_REPO` and rebuilds Chroma in
`CHROMA_PERSIST_DIRECTORY` (set to `/tmp/chroma_db` in Koyeb). Since this
directory is ephemeral, each service restart requires rebuilding the index.
`GET /health` is available for Koyeb checks and UptimeRobot, and
`POST /api/ingest` remains available for local PDF testing.

## Secrets and configuration

### Cloudflare Worker secrets

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `GITHUB_TOKEN`
- `GITHUB_REPO` (`owner/repository`)
- `KOYEB_BACKEND_URL`

Set these with `npx wrangler secret put NAME`. Do not commit values to
`wrangler.toml` or `.dev.vars`.

### Koyeb environment variables

- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `FRONTEND_URL`
- `CHROMA_PERSIST_DIRECTORY=/tmp/chroma_db`

## Local development

- Frontend: `npm run dev` from the repository root.
- AI API: `uvicorn main:app --reload --host 127.0.0.1 --port 8000` from
  `backend/`.
- Worker: `npm run dev` from `cloudflare-worker/`.
- For real Telegram webhook delivery to local Wrangler, expose its HTTPS
  endpoint with a temporary tunnel and register `<tunnel>/telegram`.

See [cloudflare-worker/README.md](./cloudflare-worker/README.md) for webhook
setup and [backend/README.md](./backend/README.md) for Koyeb deployment.
