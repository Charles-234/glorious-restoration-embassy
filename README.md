# Glorious Restoration Embassy

A premium Next.js church website built with App Router, TypeScript, Tailwind CSS, Framer Motion, and Supabase.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment variables

Create a `.env.local` file with the following values:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — your Supabase publishable key; existing deployments can keep using `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `FASTAPI_BACKEND_URL` — the base URL of the deployed FastAPI assistant service.
- `ADMIN_PASSWORD` — a secure password for the protected logs dashboard at `/admin`.
- `ADMIN_SESSION_SECRET` — a separate random secret for signing admin sessions.
- `NEWS_API_KEY` — an optional server-only NewsAPI key for local dashboard development.

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
- Daily allowance of 10 admitted website chat attempts per signed-in Supabase user
- Dedicated News page with daily scripture and attributed publisher headlines
- SEO-friendly metadata and Open Graph preview settings

### News and scripture dashboard

The dashboard displays attributed headlines from AllAfrica, Christian Daily, World History Encyclopedia, and Biblical Archaeology Society (Biblical Archaeology Review), linking each item to its publisher. World History Encyclopedia and Biblical Archaeology Society items appear under the History & Exploration filter. The feeds are revalidated hourly. Publisher thumbnails remain disabled unless image reuse rights are confirmed for every enabled source; article descriptions are not republished.

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
4. Deploy the site.

### Supabase

1. Create a Supabase project at https://app.supabase.com.
2. In the Supabase dashboard, go to `Settings > API` and copy the project URL and publishable key.
3. Apply `supabase/migrations/20261006172000_admitted_ai_chat_attempts.sql` using the Supabase SQL editor or your normal migration workflow. It adds atomic per-day admission counting.
4. Create the `newsletter`, `contacts`, and `ai_conversations` tables if they are not already present.
5. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel or your local `.env.local` file, and enable the desired Supabase Auth sign-in provider.

The website chat requires a valid Supabase sign-in session and a configured `FASTAPI_BACKEND_URL`. Each authenticated user can have 10 website chat request attempts admitted to the AI endpoint per Africa/Nairobi calendar day. Admission increments the daily count atomically before FastAPI is called, so concurrent requests cannot exceed the limit and provider/network failures still count toward spend control. Requests rejected after 10 are not forwarded to FastAPI. Admitted responses, including upstream errors, and quota-rejected responses include explicit `quotaUsed`, `quotaLimit`, and `remainingCalls` fields plus `resetTimezone`. Exhausted users receive HTTP `429` with code `CHAT_QUOTA_EXCEEDED`. Telegram continues to call the shared FastAPI assistant directly and does not use this website quota.

### Admin logs

- Visit `/admin` to see the AI conversation history stored in Supabase.
- The logs dashboard is protected by `ADMIN_PASSWORD` and will redirect to `/admin/login` when not signed in. The super-admin username is configured in `content/admins.json`.

### Editorial CMS

- The editorial CMS is available at `/cms` and uses Supabase email magic-link sign-in. It is separate from the `/admin` AI-log password; CMS access is granted only to user IDs listed in `public.cms_admins`.
- Apply `supabase/migrations/20261006180000_supabase_editorial_cms.sql` using the Supabase SQL editor or your normal migration workflow. This creates the CMS tables, row-level security policies, and public image bucket.
- Sign in at `/login?next=%2Fcms` with the editor's email, then confirm the user in Supabase Authentication. Add that authenticated user's UUID to the allowlist in the SQL editor:

  ```sql
  insert into public.cms_admins (user_id)
  values ('<AUTH_USER_UUID>')
  on conflict (user_id) do nothing;
  ```

- Reopen `/cms` after the row has been added. No CMS password or service-role key is needed; the user signs in through the configured Supabase Auth email provider.
- Published sermons, events, announcements, gallery images, and site settings are served from Supabase. Drafts remain private to authorized CMS editors.

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
