import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
    console.error("[health-supabase] Full error:", error);
    console.error("[health-supabase] error.name:", (error as Error).name);
    console.error("[health-supabase] error.message:", (error as Error).message);
    console.error("[health-supabase] error.stack:", (error as Error).stack);
    const detail =
      process.env.NODE_ENV === "production"
        ? { message: "Supabase health check failed." }
        : {
            supabase: "error",
            name: (error as Error).name,
            message: (error as Error).message || "(empty)",
            stack: (error as Error).stack?.split("\n").slice(0, 5),
          };
    return NextResponse.json(detail, { status: 500 });
  }
}
