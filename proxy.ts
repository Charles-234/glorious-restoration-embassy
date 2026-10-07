import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./utils/supabase/config";

// Paths where a Supabase session is actually consumed server-side.
// Only these paths need a token-refresh round-trip in Proxy.
const AUTHED_PATH_PREFIX = "/admin";

export async function proxy(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicConfig();
  let response = NextResponse.next({ request });

  // Always create the Supabase client so it can forward/set session cookies.
  // This is required by @supabase/ssr regardless of route.
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Per Next.js 16 docs, Proxy should only do optimistic (cookie-based)
  // checks and must not make slow database calls on every route.
  // We call auth.getUser() only for admin paths so that the session token
  // is refreshed when it is about to be used, without adding a Supabase
  // round-trip to every public page load.
  if (request.nextUrl.pathname.startsWith(AUTHED_PATH_PREFIX)) {
    const startedAt = Date.now();
    const { error } = await supabase.auth.getUser();
    const durationMs = Date.now() - startedAt;

    if (durationMs > 250) {
      console.warn("[proxy] Slow admin auth refresh", {
        pathname: request.nextUrl.pathname,
        durationMs,
      });
    }

    if (error && error.name !== "AuthSessionMissingError") {
      console.error("[proxy] Supabase session refresh failed:", error.message);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
