import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const dashboardSections = [
  { title: "Sermons", table: "sermons", href: "/admin/sermons", description: "Manage messages and recordings." },
  { title: "Events", table: "events", href: "/admin/events", description: "Manage upcoming church events." },
  { title: "Posts", table: "posts", href: "/admin/posts", description: "Manage news and announcements." },
  {
    title: "Prayer requests",
    table: "prayer_requests",
    href: "/admin/prayer-requests",
    description: "Review submitted prayer requests.",
  },
] as const;

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/admin/login");
  }

  const user = userData.user;
  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("id, role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("[admin] Could not verify administrator access.", adminError);
    redirect("/admin/login?error=lookup_failed");
  }
  if (!admin) {
    redirect("/admin/login?error=access_denied");
  }

  const counts = await Promise.all(
    dashboardSections.map(async ({ table }) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error(`[admin] Could not count ${table}.`, error);
        return null;
      }
      return count ?? 0;
    }),
  );

  return (
    <main className="container space-y-10 py-14 sm:py-20">
      <header className="readable-surface flex flex-col gap-6 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Administration</p>
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Glorious Restoration Embassy — Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{user.email ?? admin.email}</span>
            {" · "}
            <span className="capitalize">{admin.role}</span>
          </p>
        </div>
        <form action="/admin/sign-out" method="post">
          <button type="submit" className="btn btn-secondary active:scale-[0.97]">
            Sign out
          </button>
        </form>
      </header>

      <section aria-label="Content overview" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardSections.map((section, index) => (
          <Link
            key={section.table}
            href={section.href}
            className="readable-surface group rounded-[1.5rem] p-6 transition-[transform,border-color,box-shadow] duration-150 ease-out hover:-translate-y-1 hover:border-accent/50 hover:shadow-[var(--shadow-lift)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:scale-[0.98]"
          >
            <p className="text-sm font-semibold text-accent">{section.title}</p>
            <p className="mt-4 font-display text-4xl font-semibold text-foreground">
              {counts[index] ?? "—"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.description}</p>
            <span className="mt-5 inline-block text-sm font-semibold text-accent">
              Manage <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
