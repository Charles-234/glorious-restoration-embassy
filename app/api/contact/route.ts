import { NextResponse } from "next/server";
import { submitContactMessage } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  let data: { name?: string; email?: string; message?: string };
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { name, email, message } = data;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const { error } = await submitContactMessage(name, email, message);
  if (error) {
    console.error("[contact] Could not save contact message.", error);
    return NextResponse.json({ error: "Your message could not be sent. Please try again later." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
