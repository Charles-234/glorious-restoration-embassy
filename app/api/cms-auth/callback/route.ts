import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearCmsOAuthState, CMS_STATE_COOKIE, getCmsOrigin } from "@/lib/cmsOAuth";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function callbackPage(
  cmsOrigin: string,
  status: "success" | "error",
  payload: { token: string; provider: "github" } | { error: string },
): NextResponse {
  const nonce = randomBytes(18).toString("base64");
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CMS sign-in</title></head>
  <body><p>Completing GitHub sign-in…</p>
    <script nonce="${nonce}">
      (() => {
        const origin = ${safeJson(cmsOrigin)};
        const message = ${safeJson(message)};
        const send = (event) => {
          if (event.origin !== origin || event.data !== "authorizing:github") return;
          window.removeEventListener("message", send);
          window.opener.postMessage(message, origin);
          window.close();
        };
        if (!window.opener) {
          document.body.textContent = "This sign-in window was opened directly. Return to the CMS and try again.";
          return;
        }
        window.addEventListener("message", send);
        window.opener.postMessage("authorizing:github", origin);
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(CMS_STATE_COOKIE)?.value;
  const callbackUrl = new URL(request.url);
  const returnedState = callbackUrl.searchParams.get("state") ?? "";
  const code = callbackUrl.searchParams.get("code");

  let cmsOrigin: string;
  try {
    cmsOrigin = getCmsOrigin();
  } catch (error) {
    console.error("Invalid Decap CMS origin:", error);
    return clearCmsOAuthState(
      NextResponse.json(
        { error: "Decap CMS authentication is not configured correctly." },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      ),
    );
  }

  if (
    !expectedState ||
    !returnedState ||
    expectedState.length !== returnedState.length ||
    !timingSafeEqual(Buffer.from(expectedState), Buffer.from(returnedState))
  ) {
    return clearCmsOAuthState(callbackPage(cmsOrigin, "error", { error: "OAuth state validation failed." }));
  }

  const githubError = callbackUrl.searchParams.get("error");
  if (githubError || !code) {
    return clearCmsOAuthState(callbackPage(cmsOrigin, "error", { error: "GitHub sign-in was cancelled or failed." }));
  }

  const clientId = process.env.CMS_GITHUB_CLIENT_ID;
  const clientSecret = process.env.CMS_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return clearCmsOAuthState(callbackPage(cmsOrigin, "error", { error: "CMS GitHub OAuth is not configured." }));
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: new URL("/api/cms-auth/callback", cmsOrigin).toString(),
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) {
      console.error("GitHub OAuth token exchange failed:", tokenResponse.status);
      return clearCmsOAuthState(callbackPage(cmsOrigin, "error", { error: "GitHub token exchange failed." }));
    }

    const token = (await tokenResponse.json()) as GitHubTokenResponse;
    if (!token.access_token) {
      console.error("GitHub OAuth did not return an access token:", token.error ?? "unknown error");
      return clearCmsOAuthState(callbackPage(cmsOrigin, "error", { error: "GitHub did not authorize this account." }));
    }

    return clearCmsOAuthState(
      callbackPage(cmsOrigin, "success", { token: token.access_token, provider: "github" }),
    );
  } catch (error) {
    console.error("GitHub OAuth callback failed:", error);
    return clearCmsOAuthState(callbackPage(cmsOrigin, "error", { error: "GitHub sign-in could not be completed." }));
  }
}
