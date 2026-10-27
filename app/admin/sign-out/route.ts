import { NextResponse, type NextRequest } from "next/server.js";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[admin] Supabase sign-out failed.", error);
  }

  return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
}
