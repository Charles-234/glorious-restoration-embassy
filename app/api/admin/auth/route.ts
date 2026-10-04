import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const password = body?.password;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ error: "Admin password is not configured." }, { status: 500 });
  }

  if (!password || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: "admin_auth",
    value: "true",
    httpOnly: true,
    path: "/admin",
    maxAge: 60 * 60 * 24,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
