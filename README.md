# Glorious Restoration Embassy

A premium Next.js church website built with App Router, TypeScript, Tailwind CSS, Framer Motion, and Supabase.

## Quick start

```bash
npm install
npm run dev
```

`npm run dev` starts the local FastAPI assistant backend and the Next.js site
together, and waits for the backend health check before starting Next.js. The
backend virtual environment must first be set up as described in
[`backend/README.md`](./backend/README.md). To run only the frontend against an
already-running backend, use `npm run dev:frontend`.

Open `http://localhost:3000` in your browser.

## Environment variables

Create a `.env.local` file with the following values:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — your Supabase publishable key; existing deployments can keep using `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `FASTAPI_BACKEND_URL` — the base URL of the deployed FastAPI assistant service.
- `RESEND_API_KEY` — a server-only Resend API key for contact-email notifications.
- `CONTACT_FROM_EMAIL` — an email address on a domain verified with Resend.
- `ADMIN_PASSWORD` — a secure password for the protected logs dashboard at `/admin`.
- `ADMIN_SESSION_SECRET` — a separate random secret for signing admin sessions.
- `NEWS_API_KEY` — an optional server-only NewsAPI key for local dashboard development.
- `INGEST_API_TOKEN` — a long random bearer token required by the FastAPI PDF-ingestion endpoint.

Optional:

- `MPESA_NUMBER` — donation number if you want to customize the giving CTA.
- `NEWS_API_PRODUCTION_ENABLED=true` — enable NewsAPI in production only after confirming a paid NewsAPI plan and rights to display the returned headlines. Unset by default.
- `NEWS_THUMBNAILS_LICENSE_CONFIRMED=true` — include publisher-supplied thumbnails only after confirming image reuse rights for every enabled source. Unset by default.

## Features

- App Router powered page structure
- TypeScript-first architecture
- Tailwind CSS styling with glassmorphism and premium cinematic design
- Framer Motion page transitions and hover animations
- Responsive mobile-first layout
- Supabase backend for newsletter and contact form data
- Authenticated website AI chat backed by the shared FastAPI assistant and church-document retrieval system
- Daily allowance of 10 admitted website chat attempts per signed-in non-admin; CMS/admin users have unlimited access
- Dedicated News page with daily scripture and attributed publisher headlines
- SEO-friendly metadata and Open Graph preview settings

### News and scripture dashboard

The dashboard fetches headlines through RSS2JSON from Faithwire, Christian Newswire, Charisma News, and Faith News Service, alongside the optional NewsAPI source. Feed results are cached for one hour. RSS descriptions are reduced to plain text and capped at 140 characters; cards link directly to the publisher's article in a new tab. Publisher thumbnails remain disabled unless image reuse rights are confirmed. Confirm each publisher's feed and syndication terms before production use; short excerpts and attribution do not themselves grant a licence.

The Standard RSS feed is intentionally not polled or displayed because its published terms do not clearly permit automated collection or displaying feed headlines elsewhere. Nation Africa's feed and applicable terms could not be verified, so it is not polled or displayed either. Add either source only after obtaining written permission or confirming publisher terms that explicitly permit this use.

NewsAPI's free Developer plan is for development and testing only. Production use is disabled unless `NEWS_API_PRODUCTION_ENABLED=true` is set; only set this after securing an appropriate paid plan and confirming content-use rights. Keep `NEWS_API_KEY` server-side and never use a `NEXT_PUBLIC_` variable for production credentials.

## Deployment

### Vercel

1. Push this repository to GitHub.
2. Create a new Vercel project and link your repository.
3. Add the environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `FASTAPI_BACKEND_URL` (the deployed FastAPI service URL)
   - `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` (only after verifying the sending domain)
   - `INGEST_API_TOKEN` on the FastAPI deployment
4. Deploy the site.

Vercel's free Hobby plan is limited to personal, non-commercial use. Confirm eligibility for a church/organization with Vercel; do not assume that a free tier permits organizational production use. Free Render web services are suitable for previews only: they sleep after inactivity and have ephemeral filesystems. Review the deployment comparison in `SECURITY_AUDIT_REPORT.md` before selecting a host.

### Supabase

1. Create a Supabase project at https://app.supabase.com.
2. In the Supabase dashboard, go to `Settings > API` and copy the project URL and publishable key.
3. Apply `supabase/migrations/20261006172000_admitted_ai_chat_attempts.sql` using the Supabase SQL editor or your normal migration workflow. It adds atomic per-day admission counting.
4. Create the `newsletter`, `contacts`, and `ai_conversations` tables if they are not already present.
5. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel or your local `.env.local` file, and enable the desired Supabase Auth sign-in provider.

The website chat requires a valid Supabase sign-in session and a configured `FASTAPI_BACKEND_URL`. Signed-in administrators present in `admin_users` or `cms_admins` have unlimited calls; other signed-in users are limited to 10 admitted attempts per Africa/Nairobi calendar day. Admission increments atomically before FastAPI is called, so concurrent requests cannot exceed the limit and provider/network failures still count. Users who reach the limit receive HTTP `429`; internal provider errors are logged server-side and are not returned to visitors. Telegram calls the shared FastAPI assistant directly and does not use the website quota.

### Admin logs

- Visit `/admin` to see the AI conversation history stored in Supabase.
- The logs dashboard is protected by `ADMIN_PASSWORD` and will redirect to `/admin/login` when not signed in. The super-admin username is configured in `content/admins.json`.

### Editorial CMS

- The editorial CMS is available at `/cms` and uses Supabase email magic-link sign-in. It is separate from the `/admin` AI-log password; CMS access is granted only to user IDs listed in `public.cms_admins`.
- Apply the exact pending SQL migrations for this project in order using the Supabase SQL editor or your normal migration workflow. `20261007213000_admin_cms_inbox_media.sql` establishes the content/inbox/media policies, and `20261007232200_cms_kind_and_privacy_consent.sql` normalizes legacy CMS kind types and adds recorded contact-form consent. Do not rerun migrations already applied to the live project.
- Sign in at `/login?next=%2Fcms` with the editor's email, then confirm the user in Supabase Authentication. Add that authenticated user's UUID to the allowlist in the SQL editor:

  ```sql
  insert into public.cms_admins (user_id)
  values ('<AUTH_USER_UUID>')
  on conflict (user_id) do nothing;
  ```

- Reopen `/cms` after the row has been added. No CMS password or service-role key is needed; the user signs in through the configured Supabase Auth email provider.
- Published sermons, events, announcements, gallery images, and site settings are served from Supabase. Drafts remain private to authorized CMS editors.
- The public gallery separates photos and videos into their own collections, pages each collection six items at a time, and leaves media captions blank. Bundled videos use generated poster frames and native playback controls with audio enabled; hiding download controls is only a deterrent and cannot prevent copying public media.
- Configure `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` for form notifications. The sender must be verified with Resend; without those settings the message is still saved privately, but email notification is not sent. Contact and prayer submissions are delivered to the church address configured in `lib/siteData.ts`.

### Supabase schema

A ready-made schema, including the daily chat quota table and admission RPC, is
available at `supabase/schema.sql`. For an existing Supabase project, apply
the migration listed above instead of recreating the base schema.

Example Supabase table columns:

- `newsletter`
  - `id` (int, identity)
  - `email` (text)
  - `created_at` (timestamp)

- `contacts`
  - `id` (int, identity)
  - `name` (text)
  - `email` (text)
  - `message` (text)
  - `created_at` (timestamp)

## Build and production

```bash
npm run build
npm start
```

## Notes

- This project is designed to be CMS-ready and extendable.
- Use Supabase for backend data and replace placeholder AI features with real services later.
