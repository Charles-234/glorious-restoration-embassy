import { NextResponse, type NextRequest } from "next/server.js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers.js";
import { getSupabasePublicConfig } from "@/utils/supabase/config";

function getSafeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/chat";
  }

  const destination = new URL(value, "https://local.invalid");
  if (destination.origin !== "https://local.invalid") return "/chat";
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

function getLoginUrl(request: NextRequest, returnPath: string, error?: string) {
  const isAdminLogin = returnPath === "/admin" || returnPath.startsWith("/admin/");
  const loginUrl = new URL(isAdminLogin ? "/admin/login" : "/login", request.url);

  if (!isAdminLogin) loginUrl.searchParams.set("next", returnPath);
  if (error) loginUrl.searchParams.set("error", error);
  return loginUrl;
}

function redirectTo(destination: URL) {
  console.log("[callback] redirecting to:", destination.toString());
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  let returnPath = "/chat";

  try {
    const searchParams = request.nextUrl.searchParams;
    const diagnosticUrl = new URL(request.url);
    diagnosticUrl.searchParams.delete("code");
    diagnosticUrl.searchParams.delete("token_hash");
    diagnosticUrl.searchParams.delete("access_token");
    diagnosticUrl.searchParams.delete("refresh_token");
    console.log("[callback] URL:", diagnosticUrl.toString());
    console.log("[callback] code present:", !!searchParams.get("code"));
    console.log("[callback] next param:", searchParams.get("next"));

    returnPath = getSafeReturnPath(searchParams.get("next"));
    const isAdminLogin = returnPath === "/admin" || returnPath.startsWith("/admin/");
    const code = searchParams.get("code");
    const successUrl = isAdminLogin
      ? new URL("/admin", request.url)
      : new URL(returnPath, request.url);

    if (!code) {
      return redirectTo(getLoginUrl(request, returnPath, "callback"));
    }

    const response = NextResponse.redirect(successUrl);
    const cookieStore = await cookies();
    const { url, publishableKey } = getSupabasePublicConfig();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const { data: exchangeData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    console.log("[callback] step 1 ok:", {
      hasError: !!exchangeError,
      hasSession: !!exchangeData?.session,
      errorMessage: exchangeError?.message,
    });

    if (exchangeError) {
      console.error("[auth] Magic-link code exchange failed.", exchangeError);
      return redirectTo(getLoginUrl(request, returnPath, "callback"));
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
    console.log("[callback] step 2 ok:", {
      hasError: !!userError,
      userId: user?.id,
      email: user?.email,
    });

    if (userError || !user) {
      if (userError) console.error("[auth] Could not read user after magic-link exchange.", userError);
      return redirectTo(
        getLoginUrl(request, returnPath, isAdminLogin ? "no_session" : "callback"),
      );
    }

    if (!isAdminLogin) {
      console.log("[callback] redirecting to:", successUrl.toString());
      return response;
    }

    const { data, error: queryError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    console.log("[callback] step 3 ok:", {
      hasError: !!queryError,
      hasRow: !!data,
      role: data?.role,
    });

    if (queryError) {
      console.error("[auth/callback] admin lookup failed:", queryError);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error("[auth] Could not sign out after admin verification failed.", signOutError);
      return redirectTo(getLoginUrl(request, returnPath, "lookup_failed"));
    }

    if (!data) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error("[auth] Could not sign out unauthorized admin login.", signOutError);
      return redirectTo(getLoginUrl(request, returnPath, "access_denied"));
    }

    console.log("[callback] redirecting to:", successUrl.toString());
    return response;
  } catch (error) {
    console.error("[callback] FATAL:", error);
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "callback_failed");
    loginUrl.searchParams.set("reason", error instanceof Error ? error.message : String(error));
    return redirectTo(loginUrl);
  }
}
