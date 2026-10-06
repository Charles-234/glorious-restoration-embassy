import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/siteData";

export const CMS_STATE_COOKIE = "decap_github_oauth_state";

export function getCmsOrigin(): string {
  const configuredOrigin = process.env.CMS_ORIGIN ?? siteConfig.url;
  const parsedOrigin = new URL(configuredOrigin);
  if (
    (parsedOrigin.protocol !== "https:" && parsedOrigin.hostname !== "localhost") ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error("CMS_ORIGIN must be an HTTPS site origin without a path.");
  }
  return parsedOrigin.origin;
}

export function clearCmsOAuthState(response: NextResponse): NextResponse {
  response.cookies.set({
    name: CMS_STATE_COOKIE,
    value: "",
    path: "/api/cms-auth",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
