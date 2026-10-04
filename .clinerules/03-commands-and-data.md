# Commands, testing, and data policy

## Commands

```powershell
npm run dev                 # dev server on :3000
npm run build               # production build
npm run start               # serve the production build
npm run lint                # eslint
npx tsc --noEmit            # type check only
npx playwright test         # e2e suite (reuses a running dev server)
```

**Critical:** never run `npm run build` while `npm run dev` is running. They
fight over `.next`; afterwards the dev server serves HTML but 404s every CSS/JS
chunk, so pages render unstyled or blank. Stop the dev server first, or run the
build before starting it.

The same corruption happens with **two `next dev` processes**. If Playwright's
`webServer` block starts its own server while you already have one running, the
two share `.next` and the first server's assets 404. Before running
`npx playwright test`, make sure nothing is already listening on port 3000 — or
let Playwright own the server for the whole run.

In PowerShell, `> nul` does **not** discard output the way it does in `cmd` — it
creates a real file called `nul` in the repo root.

## Tests

`tests/smoke.spec.ts` covers status codes, applied CSS, horizontal overflow,
console errors, broken images and basic a11y.
`tests/theme-and-links.spec.ts` covers light/dark tokens, internal link
crawling, and SEO plumbing (sitemap, robots, canonical).

`tests/smoke.spec.ts` includes a deliberate "CSS is applied" assertion. That
check exists because the stale-`.next` failure looks like a passing page load
until you screenshot it.

## Data policy — do not ship placeholders

Anything marked `TODO(confirm)` in `lib/siteData.ts` is unverified business data
and must be replaced with real values before launch. Currently unconfirmed:
branch phone numbers, branch addresses, the office phone/email, the canonical
domain, and `ADMIN_PASSWORD`.

Specific constraints:

- `/give` and `/donate` must not fake a payment flow until real M-Pesa or bank
  details are confirmed.
- `/contact` builds a `mailto:` link on purpose. There is no form backend, so
  never show a success message that did not happen.
- Newsletter forms currently only `preventDefault()`. `/api/newsletter` exists —
  either wire it up or remove the button. Do not leave a dead subscribe button.
- Never hardcode `ADMIN_PASSWORD`. Read it from an environment variable.