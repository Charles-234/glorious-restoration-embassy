<div align="center">

![Glorious Restoration Embassy — Capsule Banner](https://capsule-render.vercel.app/api?type=waving&color=009688&height=220&section=header&text=Glorious%20Restoration%20Embassy&fontSize=48&fontColor=ffffff&animation=twinkling)

<h3 align="center">🕊️ A premium digital ministry platform • Secure by design • Built for restoration • Open for impact</h3>

<br/>

<p align="center">
  <a href="https://nextjs.org/" target="_blank"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/></a>
  <a href="https://supabase.com/" target="_blank"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/></a>
  <a href="https://fastapi.tiangolo.com/" target="_blank"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/></a>
  <a href="https://www.alxafrica.com/" target="_blank"><img src="https://img.shields.io/badge/ALX-Cybersecurity-009688?style=for-the-badge&logo=shield&logoColor=white" alt="ALX Cybersecurity Aligned"/></a>
</p>

<br/>

<p align="center">
  <a href="https://github.com/Charles-234/glorious-restoration-embassy" target="_blank">

---

## 🚀 Technical Highlights

| Focus Area | Engineering Logic & Outcome |
|---|---|
| **Server-first rendering** | Public pages are Next.js Server Components, reducing client-side JavaScript and improving first-contentful paint on low-bandwidth connections. |
| **Theme-aware UI** | Dark/light mode via `next-themes` (class-based on `<html>`), with every user-facing colour bound to semantic CSS tokens so both themes remain legible and WCAG-friendly. |
| **Performance** | Hero animation via GSAP, page transitions via Framer Motion, `next/image` with explicit dimensions, and font self-optimisation via `next/font`. |
| **Stability** | TypeScript `strict: true`, Playwright E2E smoke suite (status codes, CSS application, console errors, broken images, a11y), and theme/link crawling tests. |
| **Secure by default** | Security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`), `robots.txt` disallow on admin/api/auth paths, and HMAC-signed admin sessions with timing-safe verification. |
| **Data minimisation** | Contact and prayer requests stored with explicit privacy fields (`is_private`, `privacy_consent`, versioned notice); analytics tracks event type only — never names, emails, or message bodies (DPA-aligned). |
| **Graceful degradation** | Supabase client initialises only when env vars are present; API failures degrade to user-facing fallbacks (e.g., WhatsApp backup for contact) rather than crashing. |
| **Giving integrity** | `/give` and `/donate` expose confirmed M-Pesa Paybill details only — no simulated payment flow, no fake success states. |

    <img src="https://github-readme-stats.vercel.app/api/pin/?username=Charles-234&repo=glorious-restoration-embassy&theme=tokyonight&show_owner=true&border_color=009688" alt="Glorious Restoration Embassy Repo Card"/>
  </a>
</p>

</div>

---

## 🎯 Project Title & High-Level Pitch

**Glorious Restoration Embassy** is a public-facing church website built on the Next.js App Router with React 18 and TypeScript (strict mode). It serves as a digital branch of a physical ministry, giving visitors and members access to service times, ministries, sermons, events, a livestream, branch locations, secure online giving, contact/prayer-request submission, and an AI-assisted help chat.

From an infrastructure and operations viewpoint, the site is designed as a **hardened, theme-aware, server-first public surface** with a gated administrative area. Public content is rendered as server components where possible; interactivity is isolated to client components that require it. Sensitive administrative surfaces are separated from public routes and protected by signed session tokens and strict HTTP security headers.


---

## 🏗️ System Architecture Diagram

The diagram below is a text-based representation of request/data flow. It shows trust boundaries (public internet vs. internal administrative surface), where validation gates sit, and where secrets are resolved (environment variables — never hardcoded).

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC INTERNET                                 │
│  Visitors · Members · Search Engines · Recruiters                           │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ HTTPS / WSS
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EDGE / CDN (Vercel)                                      │
│  • Global edge delivery                                                     │
│  • Security headers injected at the edge                                    │
│    ├─ X-Frame-Options: DENY                                                 │
│    ├─ X-Content-Type-Options: nosniff                                       │
│    ├─ Referrer-Policy: strict-origin-when-cross-origin                      │
│    └─ Permissions-Policy: camera/mic/geo = ()                               │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
┌───────────────┐      ┌────────────────────┐
│  Next.js App  │      │  Next.js Middleware │
│  Router (SSR) │      │  (route guarding)   │
│  • Server     │      │  • Public vs gated  │
│    Components │      │    route split      │
│  • API Routes │      └──────────┬─────────┘
└───────┬───────┘                 │
        │                         │
        │  (1) Public content     │  (2) Admin path → session check
        ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER (Next.js)                              │
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  Page Routes │   │  API Routes  │   │  Client      │   │  Admin     │  │
│  │  (/ , /about │   │  (/api/* )   │   │  Components  │   │  Sessions  │  │
│  │   …)         │   │              │   │  (chat,      │   │  HMAC-SHA  │  │
│  └──────┬───────┘   └──────┬───────┘   │   contact,   │   │ 256,       │  │
│         │                  │           │   gallery,   │   │ 24h TTL,   │  │
│         │                  │           │   navbar,…)  │   │ roles      │  │
│         ▼                  ▼                  │                 │          │
└───────────┴────────────────┴──────────────────┴────────────────────────────┘
        │                  │                  │                 │
        │                  │                  │                 │
        ▼                  ▼                  ▼                 ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Supabase   │   │  FastAPI     │   │  WhatsApp    │   │  Env Vars    │
│  (public     │   │  Backend     │   │  (wa.me)     │   │  ADMIN_*     │
│  client,     │   │  (/api/chat) │   │  (contact    │   │  SESSION_*   │
│  RLS-aware   │   │  auth + rate │   │   fallback)  │   │  SUPABASE_*  │
│  design)     │   │  limiting    │   │              │   │  (never      │
└──────┬───────┘   │  20s timeout │   └──────────────┘   │   hardcoded) │
       │           │  input val.  │                      └──────────────┘
       │           │  (4000 char) │
       │           └──────┬───────┘
       │                  │
       └──────────────────┘
                      (trust boundary)

┌─────────────────────────────────────────────────────────────────────────────┐
│  DATA FLOW SUMMARY                                                          │
│                                                                             │
│  1. Visitor requests a page  →  Edge → Next.js SSR → HTML to browser        │
│  2. Contact / prayer POST    →  /api/contact → Supabase (is_private=true)   │
│                             →  WhatsApp fallback rendered on client         │
│  3. AI chat POST             →  Auth check → quota (10 calls/day)           │
│                             →  FastAPI backend → answer → persisted         │
│  4. Admin login              →  HMAC-signed token → /admin (gated)          │
│  5. Newsletter subscribe     →  Supabase insert (email only)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Trust boundaries enforced:**
- Public internet → Edge: TLS only; security headers applied at ingress.
- Edge → App: route split; `/admin`, `/api`, `/auth`, `/cms`, `/login`, `/search` disallowed to crawlers via `robots.txt`.
- App → Supabase: public/anon key treated as **not** an authorization boundary; RLS and least-privilege grants are the intended server-side enforcement layer.
- App → FastAPI: authenticated call only; rate-limited and time-boxed.
- Admin → Session: HMAC-SHA256 token verified with `timingSafeEqual` to resist timing attacks.

---

## 🔐 Security Implementation & Cyber Hygiene

The following controls are framed using standard industry and ALX Cybersecurity program concepts. Nothing here exposes source code or secrets; it describes the control logic only.

### 1. Secure Session Handling

Administrative access uses a stateless, HMAC-signed session token:

- **Algorithm:** HMAC-SHA256 over a base64url-encoded JSON payload (`username`, `role`, `expiresAt`).
- **Role model:** Principle of Least Privilege — two roles (`super_admin`, `admin`) so an admin cannot assume super-admin capabilities by default.
- **TTL:** 24-hour absolute expiration embedded in the token and re-validated on every request.
- **Verification:** Signature compared with Node's `crypto.timingSafeEqual` to mitigate timing-side-channel attacks.
- **Secret resolution:** Reads `ADMIN_SESSION_SECRET` / `ADMIN_PASSWORD` / `SUPER_ADMIN_PASSWORD` from environment variables — **never hardcoded**, never committed (`.env.local` is gitignored).

### 2. Input Validation & Data Sanitization

- **AI chat endpoint:** Requires authentication (`401` if missing), validates JSON shape, rejects empty queries, caps question length at 4,000 characters (`413` if exceeded), and enforces a daily quota of 10 calls per authenticated user (`429` when exhausted).
- **Contact form:** Client-side required-field and privacy-consent validation before any network call; server-side validation at `/api/contact`; prayer requests stored with `is_private: true` and versioned privacy consent.
- **Output encoding:** API error messages are generic (no stack traces or internal details returned to the client).

### 3. Secure API Handling

- All mutating endpoints use `POST` with `Content-Type: application/json`.
- Upstream FastAPI chat calls are time-boxed (20 s `AbortSignal.timeout`) and handle `502`/`503`/`504` gracefully without leaking backend internals.
- Supabase writes use typed helper functions with explicit column allow-lists; the client degrades gracefully when environment variables are absent rather than failing open.

### 4. Network & Transport Hardening

- `X-Frame-Options: DENY` — clickjacking protection.
- `X-Content-Type-Options: nosniff` — MIME-type sniffing protection.
- `Referrer-Policy: strict-origin-when-cross-origin` — referrer data minimisation.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — disables sensitive device APIs by default.

### 5. Crawler & Indexing Hygiene

Disallows indexing of administrative and internal surfaces: `/admin/`, `/api/`, `/cms/`, `/login`, `/auth/`, `/search`, `/_next/`. Canonical URLs and structured metadata keep the public surface SEO-clean.

### 6. Dependency & Supply-Chain Posture

- Root production dependency audit reported **0 known vulnerabilities** at review time.
- TypeScript strict mode + ESLint enforce type and lint safety at build time.
- Python backend dependencies are acknowledged as unpinned in the security review; a lockfile/pinning step is the identified hardening action.
- A `sharp` CVE (CVE-2026-96889) was identified in the Cloudflare Worker development toolchain only; no production Worker path invokes it.

### 7. Privacy-Aligned Data Practices

- Analytics tracks event *type* only — never name, email, or message body (DPA-aligned batching).
- Newsletter stores email only.
- Privacy notice versioning and consent timestamps are stored with submissions.

> **Note on disclosure:** A repository-only security review identified conditional findings around Supabase row-level security grants and an unpinned dependency tree. These are operational hardening items for deployment, not defects in the public application logic described here. No live credentials, `.env` contents, or private keys are stored in this repository.


---

## 🧰 Tech Stack & Dependencies

### Core Framework

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js (App Router) | Server-side rendering, API routes, routing |
| UI Library | React 18 | Component model |
| Type Safety | TypeScript (`strict`) | Compile-time correctness |
| Styling | Tailwind CSS + CSS tokens | Theme-aware, responsive design |
| Dark Mode | next-themes (class-based) | Light/dark theme on `<html>` |

### Key Libraries

| Library | Role |
|---|---|
| `@supabase/supabase-js`, `@supabase/ssr` | Data layer (newsletter, contact/prayer requests, AI transcripts, usage quotas) |
| `framer-motion` | Page transitions and animations |
| `gsap` | Homepage hero animation |
| `lucide-react` | Iconography |
| `@next/third-parties` | Safe third-party script loading |
| `@react-three/fiber`, `three` | 3D visual elements |
| `clsx` + `tailwind-merge` | Conditional class composition |

### Security & Testing

| Tool | Role |
|---|---|
| Node `crypto` (HMAC-SHA256, `timingSafeEqual`) | Admin session signing & verification |
| Playwright | E2E smoke + theme/link/SEO tests |
| ESLint + TypeScript | Lint and type enforcement |
| OWASP Top 10 alignment | Security review methodology |

### Infrastructure

- **Edge/CDN:** Vercel (security headers at the edge)
- **Backend:** FastAPI (AI chat), Cloudflare Worker (edge functions)
- **Domain:** `https://glory-embassy-of-grace.vercel.app`


---

## 💻 Simulated User Flow

Below is a text-based, terminal-style walkthrough of a visitor interacting with the system. It demonstrates the public surface, a protected chat interaction, a contact submission, and an administrative session — without showing real credentials or source code.

```bash
$ curl -I https://glory-embassy-of-grace.vercel.app/
HTTP/2 200
content-type: text/html; charset=utf-8
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
cache-control: public, max-age=0, must-revalidate

[Browser renders homepage: "Welcome Home" — service times, ministries, livestream]
Theme: light → user toggles to dark → <html class="dark"> applied via next-themes

$ User navigates to /chat
[Client component: "AI assistant — you must be signed in"]
→ Redirects to /login → authenticates → returns with session cookie

$ POST /api/chat
  { "query": "What are Sunday service times?", "history": [] }
  Authorization: Bearer <hmac-signed-session-token>

[Gate 1: Authentication verified — 200 OK]
[Gate 2: Quota admission — used 3/10, remaining 7, reset Africa/Nairobi midnight]
[Gate 3: Input validation — length < 4000 chars ✓]
→ Forwarded to FastAPI backend (20 s timeout)
← { "message": "Sunday Divine Restoration is at 9:00 AM...", "sources": [...] }
[Conversation persisted to Supabase: ai_conversations (user_question, bot_response)]
[Response returns quota metadata: quotaUsed=3, quotaLimit=10, remainingCalls=7]

$ User navigates to /contact
[Client form: name, email, message type (enquiry/prayer), privacy consent checkbox]
→ User submits; client validates required fields + consent ✓

$ POST /api/contact
  { "name": "...", "email": "...", "message": "...", "requestType": "prayer", "privacyConsent": true }
← 200 OK — saved privately (is_private=true)
← WhatsApp fallback link rendered: wa.me/254721356430?text=...
[Analytics tracks CHURCH_EVENTS.PRAYER_REQUEST_SUBMIT {type: "prayer"} — PII never sent]

$ Admin navigates to /admin/login
[Gate: public route, no session]
→ Enters credentials → server verifies against env-resolved secret
← Set-Cookie: admin_session=<base64url.payload>.<hmac-sha256.signature>
→ Redirects to /admin (gated surface: CMS, media management)

$ Subsequent request to /admin/cms
[Gate: verifyAdminSessionToken — timingSafeEqual comparison, TTL check]
← 200 OK — role = "admin" (least privilege; cannot escalate to super_admin)

$ Logout / session expiry (24h)
[Token expiresAt in payload → verifyAdminSessionToken returns null → 401 on /admin]
```


---

<div align="center">

<p align="center">
  <a href="https://github.com/Charles-234" target="_blank"><img src="https://img.shields.io/badge/📬_Contact_Me-009688?style=for-the-badge&logo=github&logoColor=white" alt="Contact"/></a>
  <a href="https://glory-embassy-of-grace.vercel.app" target="_blank"><img src="https://img.shields.io/badge/🚀_Live_Demo-009688?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/></a>
</p>

<br/>

<p align="center">
  <b>Made with ❤️ by Charles-234</b> • Infrastructure Technician & Field Operations<br/>
  <i>Public documentation mirror — source code kept private for IP & cybersecurity reasons.</i>
</p>

</div>
