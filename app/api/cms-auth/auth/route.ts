import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { CMS_STATE_COOKIE, getCmsOrigin } from "@/lib/cmsOAuth";

export async function GET() {
  const clientId = process.env.CMS_GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "CMS_GITHUB_CLIENT_ID is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let cmsOrigin: string;
  try {
    cmsOrigin = getCmsOrigin();
  } catch (error) {
    console.error("Invalid Decap CMS origin:", error);
    return NextResponse.json(
      { error: "Decap CMS authentication is not configured correctly." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const state = randomBytes(32).toString("hex");
  const callbackUrl = new URL("/api/cms-auth/callback", cmsOrigin);
  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizationUrl.searchParams.set("scope", process.env.CMS_GITHUB_SCOPE ?? "public_repo");
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set({
    name: CMS_STATE_COOKIE,
    value: state,
    path: "/api/cms-auth",
    maxAge: 10 * 60,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
