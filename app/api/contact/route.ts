import { NextResponse } from "next/server";
import { submitContactMessage } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const data = await request.json();
  const { name, email, message } = data;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const { error } = await submitContactMessage(name, email, message);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
