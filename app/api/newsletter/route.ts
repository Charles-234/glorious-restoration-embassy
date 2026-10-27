import { NextResponse } from "next/server.js";
import { saveNewsletterSubscriber } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  let data: { email?: string };
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!data?.email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { error } = await saveNewsletterSubscriber(data.email);
  if (error) {
    console.error("[newsletter] Could not save subscriber.", error);
    return NextResponse.json({ error: "Subscription could not be completed. Please try again later." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
