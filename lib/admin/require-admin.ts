import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && userError.name !== "AuthSessionMissingError") {
    console.error("[admin] Could not verify the signed-in user.", userError);
    redirect("/admin/login?error=lookup_failed");
  }
  if (!user) redirect("/admin/login");

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("[admin] Could not verify administrator access.", adminError);
    redirect("/admin/login?error=lookup_failed");
  }
  if (!admin) redirect("/admin/login?error=access_denied");

  return { supabase, user, role: admin.role };
}
