# Glorious Restoration Embassy Telegram Worker

The Cloudflare Worker hosts the Telegram webhook using grammY. CMS writes are
committed to the configured GitHub repository; ordinary messages are forwarded
to the FastAPI service on Koyeb.

## Requirements

- Node.js 20 or newer
- A Cloudflare account and `npx wrangler login`
- A Telegram bot token from BotFather
- A GitHub token with Contents read/write permission on the website repository
- `GITHUB_REPO` in `owner/repository` format
- `KOYEB_BACKEND_URL`, such as `https://your-service.koyeb.app`
- `content/admins.json` committed to the repo, for example:

  ```json
  { "admins": [123456789] }
  ```

  Use numeric Telegram user IDs. The file is read from GitHub for each CMS
  command; if it is missing, no user is authorized to publish.

## Install and configure

From this directory:

```powershell
npm install
npx wrangler login
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put GITHUB_REPO
npx wrangler secret put KOYEB_BACKEND_URL
npm run typecheck
npm run deploy
```

Wrangler prompts for each value; do not commit secrets or put them in
`wrangler.toml`. `TELEGRAM_WEBHOOK_SECRET` should be a random string of 1-256
characters containing only letters, numbers, `_`, or `-`.

After deployment, the public Worker URL is typically
`https://glorious-bot.<your-subdomain>.workers.dev`. Register it as Telegram's
webhook from PowerShell, keeping the token out of the command history:

```powershell
$token = Read-Host "Telegram bot token"
$secret = Read-Host "Telegram webhook secret"
$workerUrl = Read-Host "Worker URL, e.g. https://glorious-bot.example.workers.dev"
$payload = @{
  url = "$workerUrl/telegram"
  secret_token = $secret
  allowed_updates = @("message")
} | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post `
  -Uri "https://api.telegram.org/bot$token/setWebhook" `
  -ContentType "application/json" `
  -Body $payload
Remove-Variable token, secret, payload
```

Cloudflare supplies HTTPS for the deployed Worker. For local webhook testing,
start `npm run dev` and expose its local port with a temporary HTTPS tunnel
(for example, `ngrok http 8787`), then register the tunnel URL plus `/telegram`
using the same `setWebhook` request. Set local-only values in `.dev.vars` (which
is git-ignored):

```dotenv
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=your_local_secret
GITHUB_TOKEN=your_github_token
GITHUB_REPO=owner/repository
KOYEB_BACKEND_URL=http://127.0.0.1:8000
```

## Commands

- `/start`, `/help`, `/status`
- `/blog Title === Content`
- `/sermon Title === VideoURL === Description`
- `/event Title === Date === Location === Description`
- `/link Title === URL`
- Send a photo with `/upload` as its caption to add it to `public/gallery/`.

CMS commands and photo uploads require the sender's Telegram ID to be listed in
`content/admins.json`. Sermons and events are written as JSON to match the
current frontend's content reader; blog posts and resource links are Markdown.
URLs accepted for sermons and resources must use HTTPS.

The Worker health route is `GET /health`. For manual verification, send
`/status` to the Telegram bot after setting its webhook; the response reports
the bot state and repository without exposing credentials.
