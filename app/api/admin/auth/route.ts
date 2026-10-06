import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSessionToken, type AdminRole } from "@/lib/adminAuth";
import adminConfigJson from "@/content/admins.json";

function secretsMatch(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  return (
    candidateBytes.length === expectedBytes.length &&
    timingSafeEqual(candidateBytes, expectedBytes)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    throw error;
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const { username: rawUsername, password } = body as Record<string, unknown>;
  const username = typeof rawUsername === "string" ? rawUsername.trim() : "";
  if (!username || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const adminConfig = adminConfigJson as {
    super_admin?: string | number;
    admins?: Array<string | number>;
  };

  const normalizedUsername = username.toLocaleLowerCase("en-US");
  const superAdmin = String(adminConfig.super_admin ?? "").trim();
  const isSuperAdmin =
    superAdmin.length > 0 && normalizedUsername === superAdmin.toLocaleLowerCase("en-US");
  const listedAdmins = Array.isArray(adminConfig.admins) ? adminConfig.admins : [];
  const isAdmin = listedAdmins.some(
    (admin) =>
      (typeof admin === "string" || typeof admin === "number") &&
      String(admin).trim().toLocaleLowerCase("en-US") === normalizedUsername,
  );

  if (!isSuperAdmin && !isAdmin) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const role: AdminRole = isSuperAdmin ? "super_admin" : "admin";
  const expectedPassword = isSuperAdmin
    ? process.env.SUPER_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD
    : process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json({ error: "Admin password is not configured." }, { status: 500 });
  }
  if (!secretsMatch(password, expectedPassword)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const sessionToken = createAdminSessionToken(username, role);
  if (!sessionToken) {
    return NextResponse.json({ error: "Admin session signing is not configured." }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: "admin_auth",
    value: sessionToken,
    httpOnly: true,
    path: "/admin",
    maxAge: 60 * 60 * 24,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
