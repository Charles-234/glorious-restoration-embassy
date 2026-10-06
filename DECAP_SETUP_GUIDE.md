# Decap CMS on Vercel

The content manager is available at `/cms/`. The regular site administrator
dashboard remains at `/admin/`.

Decap writes content to this GitHub repository, and Vercel rebuilds the site
after each commit. GitHub sign-in is handled by the Vercel-hosted OAuth routes
at `/api/cms-auth/auth` and `/api/cms-auth/callback`; Netlify Identity and Git
Gateway are not used.

## Configure GitHub OAuth

1. Create a GitHub OAuth App in **Settings → Developer settings → OAuth Apps**.
2. Set its authorization callback URL to:
   `https://gloriousrestorationembassy.org/api/cms-auth/callback`
3. In Vercel, configure these environment variables for Production:
   - `CMS_GITHUB_CLIENT_ID` — OAuth app client ID.
   - `CMS_GITHUB_CLIENT_SECRET` — OAuth app client secret.
   - `CMS_ORIGIN` — the exact public CMS origin, for example
     `https://gloriousrestorationembassy.org`.
   - `CMS_GITHUB_SCOPE` — `public_repo` for a public repository; set to `repo`
     only if the content repository is private.
4. Ensure each CMS editor's GitHub account has permission to push to
   `Charles-234/glorious-restoration-embassy`.
5. Redeploy after setting the environment variables, then open `/cms/` and sign
   in with GitHub.

Do not commit OAuth secrets or use preview-deployment URLs as `CMS_ORIGIN`.
The callback URL in the GitHub OAuth App, `CMS_ORIGIN`, and the `base_url` in
`public/cms/config.yml` must use the same production domain.

## Content collections

The CMS manages sermons, events, gallery photos, announcements, and site
settings in `content/`. Sermon entries may include a YouTube, Facebook video,
or direct MP4 URL. Documents for the assistant's knowledge base belong in
`content/documents/`.

## Local setup

The production OAuth callback is intentionally restricted to `CMS_ORIGIN`.
For local CMS work, use a separate GitHub OAuth App and set its callback and
`CMS_ORIGIN` to your local HTTPS development origin. Temporarily set the
`base_url` in `public/cms/config.yml` to that same origin as well; do not weaken
the production origin check.
