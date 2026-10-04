# Project overview

Glorious Restoration Embassy — a public church website (Next.js 14 App Router).

## Stack

- Next.js `^14.2.5`, React 18, TypeScript `strict: true`
- Tailwind CSS 3 with custom brand tokens (`brand-deep`, `brand-royal`, `brand-gold`, …)
- `next-themes` for light/dark (dark is class-based on `<html>`)
- `framer-motion` for page transitions, GSAP for the homepage hero
- `lucide-react` icons, `@supabase/supabase-js` for data
- Playwright for end-to-end tests

## Structure

- `app/` — routes. Public pages are plain `page.tsx` server components.
- `components/` — shared UI. Keep components theme-aware (see conventions).
- `lib/siteData.ts` — **single source of truth** for domain, contact details,
  metadata, footer details and sitemap URLs. Never hardcode these anywhere else.
- `content/`, `data/` — content and JSON data files.
- `tests/` — Playwright specs.
- `public/` — static assets, `robots.txt`, admin config.

## Routes

Public: `/`, `/about`, `/ministries`, `/sermons`, `/events`, `/gallery`,
`/livestream`, `/branches`, `/contact`, `/give`, `/donate`, `/pastor`, `/blog`,
`/search`, `/privacy`, `/terms`.

Gated: `/admin` (password), `/admin/login`.

If you add a public route, add it to **all** of: `app/sitemap.xml/route.ts`, the
navigation in `components/navbar.tsx` (if it belongs in the menu), and
`PUBLIC_ROUTES` in `tests/smoke.spec.ts`.