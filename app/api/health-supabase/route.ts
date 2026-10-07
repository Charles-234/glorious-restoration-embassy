import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function getSupabaseErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "Unknown Supabase error";
  }

  const errorRecord = error as Record<string, unknown>;
  const code = typeof errorRecord.code === "string" ? errorRecord.code : null;
  const details = typeof errorRecord.details === "string" ? errorRecord.details : null;
  const message = typeof errorRecord.message === "string" ? errorRecord.message : null;

  if (code === "PGRST205" || code === "42P01") {
    return "The public.site_content table is missing in the configured Supabase project. Apply the editorial CMS migration and verify the schema cache.";
  }

  return message || details || "Supabase health check failed.";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const [sermonsResult, adminsResult] = await Promise.all([
      supabase.from("sermons").select("*", { count: "exact", head: true }),
      supabase.from("admin_users").select("*", { count: "exact", head: true }),
    ]);

    if (sermonsResult.error) {
      throw sermonsResult.error;
    }
    if (adminsResult.error) {
      throw adminsResult.error;
    }

    return NextResponse.json({
      supabase: "connected",
      sermons_count: sermonsResult.count ?? 0,
      admins_count: adminsResult.count ?? 0,
    });
  } catch (error) {
    const errorCode = typeof error === "object" && error && "code" in error ? String(error.code) : null;
    const errorMessage = getSupabaseErrorMessage(error);

    console.error("[health-supabase] Health check failed.", {
      code: errorCode,
      message: errorMessage,
      error,
    });

    return NextResponse.json(
      {
        supabase: "error",
        code: errorCode,
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
