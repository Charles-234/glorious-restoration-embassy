# Conventions

## Theme tokens — the important rule

Every user-facing colour must come from a semantic token so light and dark both
work. Use `foreground`, `muted-foreground`, `accent`, `border`, `card`, `muted`,
`primary`, `background`. Add a token in `app/globals.css` if you need one.

**Never** hardcode light-only values like `text-slate-900`, `bg-white`,
`border-gray-200` in shared components — they are invisible or glaring in dark
mode. (The footer is the one deliberate exception: it is a permanently dark navy
surface, so `text-white/70` and `border-white/10` are correct there.)

Verified token values:

- `--background` light `rgb(249, 247, 243)` (cream), dark `rgb(11, 18, 34)` (navy)

Shared utility classes already exist in `globals.css`: `.cta-link`,
`.lightbox-scrim`, `.media-scrim`, `.readable-surface`, `.text-legible`.

## Components

- Functional components, `"use client"` only where interactivity requires it.
- Interactive/animated files need the client directive; `ai-chatbot.tsx` must not
  contain an apostrophe inside a template literal.
- Brand colours: navy = `brand-deep` / `brand-royal`, gold = `brand-gold` /
  `brand-accent`.
- Prefer `<Image>` from `next/image` with explicit `width`/`height` or
  `fill`, and always give `alt` text.

## Writing copy

Warm, pastoral, non-commercial. No invented statistics, dates, or statistics
about attendance. Never claim a donation was processed unless it really was.