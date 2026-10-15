# Website Security Review

**Review date:** 2026-10-15
**Scope:** Repository-only review of the Next.js website, its API and integrations, the FastAPI backend, Supabase schema/client use, Cloudflare Worker, dependency manifests/lockfiles, and application configuration.
**Method:** Defensive review aligned with OWASP Top 10 (2021), OWASP API Security Top 10 (2023), and OWASP Top 10 for LLM Applications. Findings distinguish code-evidenced issues from conditional deployment risks.

## Executive summary

Two material findings require attention:

1. The Supabase bootstrap schema creates public tables without RLS or explicit least-privilege grants. If deployed with ordinary Data API grants, unauthenticated access could expose newsletter addresses and AI conversation records.
2. The Cloudflare Worker development dependency tree resolves `sharp@0.35.4`, which is in the affected range for **CVE-2026-96889** / **GHSA-wq5f-xc86-pv6w**. This is a vulnerable development-toolchain dependency; no production Worker code path invoking it was identified.

The review also identified backend chat access-control/cost-boundary concerns, chat content in logs, prompt-injection exposure in retrieved content, missing application-level CSP/HSTS, and unpinned Python dependencies. These are listed as hardening or operational risks because production reachability, headers, permissions, and runtime state were not verified.

## Findings

### 1. Supabase public tables may expose personal and conversation data

**Severity:** High, conditional on deployment and grants
**CVSS 3.1 estimate:** 7.5 — `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`
**Confidence:** 8/10
**OWASP:** OWASP Top 10 A01:2021 Broken Access Control; data exposure / least-privilege failure
**Evidence:** `supabase/schema.sql:3-22`; `lib/supabaseClient.ts:21-22,46-68`; `utils/supabase/config.ts:1-14`

**What is wrong:** The schema creates `public.newsletter`, `public.contacts`, and `public.ai_conversations` without enabling row-level security (RLS), defining access policies, or explicitly revoking broad role grants. The schema does enable RLS and revoke access for `ai_chat_daily_usage` later in the file (`supabase/schema.sql:32-34`), but does not apply equivalent protections to the other tables. The app uses the public Supabase client for newsletter writes and AI transcript handling, including a helper that selects transcript fields.

**5W+1H**

- **Who:** An unauthenticated Internet user who can obtain the public Supabase project URL and publishable/anon key.
- **What:** Potentially read table records; write or other mutations may also be possible depending on actual grants.
- **When:** If this schema has been applied and the Supabase Data API is enabled with ordinary role grants.
- **Where:** Table definitions and application access are identified above; relevant REST endpoints would be the project's `/rest/v1/newsletter`, `/rest/v1/contacts`, and `/rest/v1/ai_conversations`.
- **Why:** A public/anon key is intentionally presentable to browsers and is not an authorization boundary. No table-level RLS policy or explicit least-privilege grant is present in the reviewed schema for these tables.
- **How:** A caller could attempt requests to the Supabase REST endpoints using the public key. Whether the requests succeed depends on live RLS state and database privileges, which were not tested.

**Impact:** Exposure could include subscriber email addresses, contact messages, and sensitive text users entered into AI conversations. The impact depends on what data is present and actual deployed permissions. No live database access was performed, so exposure is not confirmed.

**Recommendations:**

1. Enable RLS on every exposed table and explicitly revoke unnecessary `anon` and `authenticated` privileges.
2. Allow only the minimum required anonymous operation on `newsletter` (typically a narrowly scoped insert); deny public reads, updates, and deletes. Consider validating submissions through a server endpoint.
3. Keep contact records and AI conversation transcripts private. Prefer not persisting transcripts; otherwise associate records with authenticated users and enforce ownership policies.
4. Keep Supabase service-role credentials exclusively server-side. Never treat the publishable/anon key as a secret or as authorization.
5. Verify the live project's `relrowsecurity`, policies, grants, and Data API behavior. Test that unauthenticated REST reads and mutations are denied for private tables and only the intended newsletter operation succeeds.

### 2. Vulnerable `sharp` version in the Cloudflare Worker development toolchain

**Severity:** High upstream advisory; production exposure not established
**Advisory score:** CVSS 4.0 8.9 (upstream advisory score; not a site-specific score)
**Confidence:** 9/10 that the locked development dependency is affected; lower confidence of practical impact outside affected developer/build environments
**OWASP:** OWASP Top 10 A06:2021 Vulnerable and Outdated Components; software supply-chain risk
**CVE/advisory:** CVE-2026-96889; [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)
**Evidence:** `cloudflare-worker/package-lock.json:1443-1453,1514-1526`; `cloudflare-worker/package.json:14-18`

**What is wrong:** The Worker lockfile resolves `sharp@0.35.4` through `miniflare@5.20261001.0-alpha`. The cited advisory affects versions below `0.35.5` and describes a librsvg memory vulnerability that can lead to RCE on glibc Linux under specific runtime and SVG-processing conditions. The audit identified the upstream advisory score as CVSS 4.0 8.9; that score describes the advisory and is not a confirmed score for this website's production exposure.

**5W+1H**

- **Who:** A developer, CI job, or build/test runner that executes the affected toolchain under vulnerable runtime conditions.
- **What:** A vulnerable image-processing dependency is present in the locked development dependency tree.
- **When:** Only if the affected dependency is executed in a susceptible environment and the required SVG/input conditions are met.
- **Where:** `sharp` is resolved in `cloudflare-worker/package-lock.json`; Wrangler/Worker development tooling is declared in `cloudflare-worker/package.json`.
- **Why:** The resolved version `0.35.4` is below the advisory's patched version `0.35.5`.
- **How:** The advisory's exploit class involves triggering vulnerable SVG processing. No production Worker code path invoking `sharp` was identified, and Miniflare is not a deployed Worker dependency.

**Impact:** Potential compromise of a developer or build host in a susceptible environment. No evidence establishes that this package is shipped to or invoked by the production Worker.

**Recommendations:**

1. Upgrade Wrangler/Miniflare or otherwise update the dependency resolution so the lockfile resolves `sharp >=0.35.5`.
2. Regenerate and review the Worker lockfile using the repository's package manager; do not hand-edit lockfile entries.
3. Re-run the Worker dependency audit and add an automated dependency audit to CI.
4. Until patched, avoid processing untrusted SVGs using the affected toolchain.

## Additional hardening and operational risks

These findings are evidence-backed concerns, but were not scored as confirmed exploitable vulnerabilities because deployment configuration, live reachability, or exploit impact could not be established.

### Backend chat endpoint bypasses website authentication and quota controls

**OWASP:** OWASP API Security access-control risk; potential unrestricted resource consumption
**Evidence:** `backend/main.py:132-134`; website flow in `lib/chat-api.ts`; Worker call in `cloudflare-worker/src/index.ts:367-384`

- **Who:** Any caller able to reach the FastAPI backend.
- **What:** The `/api/chat` endpoint does not authenticate its caller. The website flow performs authentication and quota checks, while the Worker invokes the backend without an identity token.
- **When:** If the backend endpoint is Internet-reachable and the website's login/quota is intended as an abuse or cost boundary.
- **Where:** FastAPI `/api/chat`; the site's chat client and Cloudflare Worker backend request.
- **Why:** Enforcement only in the website-facing flow can be bypassed by calling the backend directly. The Telegram bot also uses the endpoint, so public access might be intentional.
- **How:** A caller with network access could issue direct requests outside the website flow and potentially consume model/API resources without website quota enforcement.

**Recommendation:** Decide and document the intended trust model. If website quotas are a security or cost control, require service-to-service authentication at the backend, separate Telegram and website identities/routes, and apply server-side per-identity rate limits, request limits, and spend controls. Verify backend network reachability and test direct unauthenticated requests.

### Chat question text is written to logs

**OWASP:** A09:2021 Security Logging and Monitoring Failures; CWE-532 (Insertion of Sensitive Information into Log File)
**Evidence:** `backend/main.py:136`

- **Who:** Operators or anyone who gains access to application logs; the exposure depends on the hosting provider's log controls.
- **What:** The first 60 characters of each chat question are logged.
- **When:** Whenever the chat endpoint handles a request.
- **Where:** Backend application logging in `backend/main.py`.
- **Why:** Users may include sensitive pastoral, personal, or crisis-related details in free-text questions.
- **How:** Sensitive fragments may be copied into centralized logs and retained or accessed beyond the original conversation.

**Recommendation:** Remove raw question text from logs. Log only a request ID, length, route, timing, and non-sensitive status fields. Review production log access, retention, exports, and redaction.

### Retrieved web/search content is not explicitly isolated from model instructions

**OWASP:** OWASP Top 10 for LLM Applications LLM01: Prompt Injection
**Evidence:** `backend/agent.py:36-49,162-177`

- **Who:** A person able to publish or influence content included in search/index results.
- **What:** Retrieved snippets are inserted into model context without an explicit untrusted-data boundary.
- **When:** When retrieved content containing adversarial instructions is included in a model request.
- **Where:** Web-search retrieval and prompt construction in `backend/agent.py`.
- **Why:** The model may treat hostile retrieved text as instructions rather than as data.
- **How:** Search-indexed content could manipulate answer content. The inspected flow did not expose tools or privileged actions, so this is an output-manipulation risk; no data exfiltration or system compromise was demonstrated.

**Recommendation:** Delimit retrieved text as untrusted data, separate it structurally from system/developer instructions, constrain the model to answer from relevant evidence, and add adversarial prompt-injection tests. Reassess if tools or sensitive data access are added.

### No application-level CSP or HSTS in Next.js configuration

**OWASP:** A05:2021 Security Misconfiguration
**Evidence:** `next.config.mjs:12-22`

- **Who:** Site visitors, particularly users exposed to script injection or network downgrade/interception conditions.
- **What:** The checked Next.js configuration sets several security headers but not Content-Security-Policy or Strict-Transport-Security.
- **When:** If those headers are also absent from the deployed edge/server response.
- **Where:** Next.js response-header configuration in `next.config.mjs`.
- **Why:** CSP can constrain script execution and resource loading; HSTS instructs browsers to use HTTPS for future connections.
- **How:** Without these controls, impact from other client-side flaws or insecure transport conditions may be greater.

**Recommendation:** Inspect deployed response headers first, since an edge provider may add them. Add a CSP tailored to the app's analytics, fonts, embeds, and Supabase usage, starting in report-only mode and then enforcing after validation. Configure HSTS at the trusted HTTPS edge after confirming HTTPS and subdomain readiness; do not enable `includeSubDomains` or preload without verifying every affected host.

### Python backend dependencies are unpinned

**OWASP:** A06:2021 Vulnerable and Outdated Components; build reproducibility/supply-chain risk
**Evidence:** `backend/requirements.txt:1-19`; no Python lockfile was tracked in the reviewed repository

- **Who:** Developers and deployment/CI systems resolving Python dependencies.
- **What:** Requirements list packages without versions and there is no tracked lockfile.
- **When:** Every install/build that resolves dependencies from the manifest.
- **Where:** Backend dependency manifest and deployment process.
- **Why:** Different installs may resolve different versions, making builds non-reproducible and making deployed dependency exposure hard to verify.
- **How:** A deployment may receive a newer or otherwise different dependency set than the one previously audited.

**Recommendation:** Pin and lock direct and transitive dependencies with hashes using the project's deployment tooling. Audit the resolved lockfile in CI and ensure the deployed artifact uses that exact resolution.

## Dependency and secret checks performed

- The root application production dependency audit reported **0 production dependency vulnerabilities** at audit time.
- The full root dependency audit reported `braces` advisories through the ESLint development dependency tree; these were not included as site vulnerabilities because the identified issues concern denial of service in that development dependency tree.
- `pip-audit -r backend/requirements.txt` found no known vulnerabilities in the resolved set at audit time. Because the requirements are unpinned, this does not establish the status of the deployed Python dependency set.
- The Worker audit identified the `sharp` advisory above. The audit reported that NVD had not published a record at the time checked.
- No tracked `.env` file or private-key-like file was found. `.env.local` was ignored and untracked; its contents and deployed secrets were not inspected. No hardcoded credential was confirmed.

## Prioritized remediation plan

1. **Immediately:** Confirm live Supabase RLS state and grants; enable RLS and least-privilege policies for exposed tables; verify unauthenticated REST behavior.
2. **Immediately:** Update the Worker toolchain lockfile to resolve patched `sharp` and run the dependency audit.
3. **Next:** Define and enforce authentication, rate limiting, and spend controls for the backend chat endpoint without breaking the Telegram integration.
4. **Next:** Stop logging user-entered chat text and review log access/retention.
5. **Next:** Pin and lock Python dependencies; audit the exact deployment resolution.
6. **Hardening:** Validate deployed headers and roll out CSP and HSTS safely; add prompt-injection regression tests and untrusted-content handling.

## Limitations

This was a repository-only, read-only review. The live Supabase project, database grants/data, deployment secrets, hosted response headers, deployed FastAPI endpoint reachability, and production dependency resolution were not accessed. Therefore Supabase exposure, edge-added headers, backend reachability, and deployed dependency status require operational verification. CVSS values above are estimates for stated assumptions or upstream advisory scores, not a substitute for environment-specific risk analysis.
