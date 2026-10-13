import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CmsWorkspace } from "@/components/cms-workspace";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Content management",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CmsPageProps = {
  searchParams: Promise<{ kind?: string }>;
};

export default async function CmsPage({ searchParams }: CmsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data.user) {
    redirect("/login?next=%2Fcms");
  }

  const { data: membership, error } = await supabase
    .from("cms_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (error || adminError) {
    console.error("[cms] Could not verify CMS administrator membership.", {
      membershipError: error,
      adminError,
    });
    return (
      <main className="container py-24">
        <section className="readable-surface mx-auto max-w-2xl space-y-4 rounded-[2rem] p-8">
          <h1 className="text-3xl font-semibold text-foreground">CMS setup is incomplete</h1>
          <p className="text-muted-foreground">
            Apply the Supabase editorial CMS migration, then add this signed-in account to
            `cms_admins` in the Supabase SQL editor.
          </p>
          <Link href="/" className="cta-link">Return to the website</Link>
        </section>
      </main>
    );
  }

  if (!membership && !admin) {
    return (
      <main className="container py-24">
        <section className="readable-surface mx-auto max-w-2xl space-y-4 rounded-[2rem] p-8">
          <h1 className="text-3xl font-semibold text-foreground">CMS access not granted</h1>
          <p className="text-muted-foreground">
            This Supabase account is signed in but is not listed as an authorized content editor.
            Ask the project owner to add its user ID to `cms_admins`.
          </p>
          <Link href="/" className="cta-link">Return to the website</Link>
        </section>
      </main>
    );
  }

  const validKinds = ["sermon", "event", "announcement", "gallery", "setting"] as const;
  const initialKind = validKinds.find((kind) => kind === params.kind) ?? "sermon";
  return <CmsWorkspace email={data.user.email ?? "Signed-in editor"} initialKind={initialKind} />;
}
