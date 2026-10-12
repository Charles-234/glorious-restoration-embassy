import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsMediaManager } from "@/components/cms-media-manager";
import { listAllMedia } from "@/lib/media-admin";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Media library",
  robots: { index: false, follow: false },
};

export default async function CmsMediaPage() {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data.user) {
    redirect("/login?next=%2Fcms%2Fmedia");
  }

  const userId = data.user.id;
  const [membershipResult, adminResult] = await Promise.all([
    supabase.from("cms_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("admin_users").select("id").eq("id", userId).maybeSingle(),
  ]);

  if (membershipResult.error || adminResult.error) {
    console.error("[cms/media] Could not verify media library access.", {
      membershipError: membershipResult.error,
      adminError: adminResult.error,
    });
    redirect("/cms");
  }

  if (!membershipResult.data && !adminResult.data) {
    redirect("/cms");
  }

  const rows = await listAllMedia();

  return <CmsMediaManager email={data.user.email ?? "Signed-in editor"} initialRows={rows} />;
}
