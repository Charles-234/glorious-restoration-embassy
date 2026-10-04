import { NextResponse } from "next/server";
import { saveNewsletterSubscriber } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const data = await request.json();

  if (!data?.email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { error } = await saveNewsletterSubscriber(data.email);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
