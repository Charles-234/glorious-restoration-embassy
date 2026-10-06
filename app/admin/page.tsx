import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchAIConversations } from "@/lib/supabaseClient";
import { siteConfig } from "@/lib/siteData";
import { verifyAdminSessionToken } from "@/lib/adminAuth";

export const metadata = {
  title: `Admin AI Logs — ${siteConfig.brandName}`,
  description: "View recent AI chat logs captured in Supabase for admin review."
};

function formatTimestamp(value: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminSession = verifyAdminSessionToken(cookieStore.get("admin_auth")?.value);
  const adminPassword =
    process.env.ADMIN_PASSWORD ?? process.env.SUPER_ADMIN_PASSWORD;

  if (!adminPassword) {
    return (
      <main className="container py-24">
        <section className="rounded-[2rem] border border-destructive/30 bg-destructive/10 p-10 text-destructive">
          <h1 className="text-3xl font-semibold">Admin password not configured</h1>
          <p className="mt-4 text-muted-foreground">
            Set the `ADMIN_PASSWORD` environment variable to enable the protected admin dashboard.
          </p>
        </section>
      </main>
    );
  }

  if (!adminSession) {
    redirect("/admin/login");
  }

  const { data, error } = await fetchAIConversations(100);
  const conversations = data ?? [];

  return (
    <main className="container space-y-10 py-24">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.32em] text-accent">Admin dashboard</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">AI conversation logs</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {adminSession.username} ({adminSession.role === "super_admin" ? "Super admin" : "Admin"})
        </p>
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">Review recent question-and-answer exchanges stored in Supabase, along with timestamps and admin access links.</p>
      </section>

      <section className="readable-surface space-y-6 rounded-[2rem] p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Recent AI interactions</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fetched from the `ai_conversations` Supabase table.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/chat" className="btn btn-primary">
              Open chat
            </Link>
            <Link href="/search" className="btn btn-secondary">
              Open search
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            Failed to load AI logs: {error.message}
          </div>
        ) : null}

        {conversations.length === 0 ? (
          <div className="rounded-3xl border border-border bg-muted p-8 text-muted-foreground">
            No AI conversation logs were found. Ensure your Supabase table `ai_conversations` is populated and the environment keys are configured.
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation: any) => (
              <article key={conversation.id} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.32em] text-accent">Conversation #{conversation.id}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{formatTimestamp(conversation.created_at)}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-border bg-muted p-4">
                    <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">User question</p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{conversation.user_question}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-card p-4">
                    <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Bot response</p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{conversation.bot_response}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
