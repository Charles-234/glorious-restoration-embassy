import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { deletePrayerRequest, updatePrayerRequest } from "./actions";

type PrayerRequest = {
  admin_request_id: string;
  name: string;
  email: string;
  request: string;
  request_type: "prayer" | "enquiry";
  status: "new" | "contacted" | "closed";
  is_private: boolean;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Some fields were invalid. Review the request and try again.",
  update_failed: "The item could not be updated. Check the inbox migration and administrator access.",
  delete_failed: "The item could not be deleted. Check the inbox migration and administrator access.",
};

const successMessages: Record<string, string> = {
  updated: "Inbox item updated.",
  deleted: "Inbox item deleted.",
};

function inputClassName() {
  return "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground";
}

export default async function PrayerRequestsAdminPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase
    .from("prayer_requests")
    .select("admin_request_id,name,email,request,request_type,status,is_private,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/prayer-requests] Could not load the private inbox.", error);
  }

  const requests = (data ?? []) as PrayerRequest[];

  return (
    <main className="container space-y-8 py-10 sm:py-16">
      <header className="space-y-3">
        <Link href="/admin" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
          ← Admin dashboard
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Private inbox</p>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Prayer requests & enquiries
        </h1>
        <p className="text-sm text-muted-foreground">
          {requests.length} {requests.length === 1 ? "submission" : "submissions"} · visible only to administrators
        </p>
      </header>

      {error ? (
        <section role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm">
          The private inbox could not be loaded. Apply the latest admin inbox migration and verify
          that this user is in `admin_users`.
        </section>
      ) : null}
      {params.error && errorMessages[params.error] ? (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          {errorMessages[params.error]}
        </p>
      ) : null}
      {params.success && successMessages[params.success] ? (
        <p role="status" className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm">
          {successMessages[params.success]}
        </p>
      ) : null}

      {requests.length ? (
        <section aria-label="Prayer request and enquiry submissions" className="grid gap-5">
          {requests.map((item) => (
            <article key={item.admin_request_id} className="readable-surface space-y-5 rounded-2xl p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.request_type === "prayer" ? "Prayer request" : "Church enquiry"} ·{" "}
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" })
                      .format(new Date(item.created_at))}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold capitalize">
                  {item.status}
                </span>
              </div>

              <form action={updatePrayerRequest} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="admin_request_id" value={item.admin_request_id} />
                <label className="text-sm font-semibold text-foreground">
                  Name
                  <input className={inputClassName()} name="name" defaultValue={item.name} required maxLength={120} />
                </label>
                <label className="text-sm font-semibold text-foreground">
                  Email
                  <input className={inputClassName()} name="email" type="email" defaultValue={item.email} required maxLength={320} />
                </label>
                <label className="text-sm font-semibold text-foreground">
                  Type
                  <select className={inputClassName()} name="request_type" defaultValue={item.request_type}>
                    <option value="prayer">Prayer request</option>
                    <option value="enquiry">Church enquiry</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-foreground">
                  Status
                  <select className={inputClassName()} name="status" defaultValue={item.status}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-foreground sm:col-span-2">
                  Message
                  <textarea
                    className={`${inputClassName()} min-h-32 resize-y`}
                    name="request"
                    defaultValue={item.request}
                    required
                    maxLength={5000}
                  />
                </label>
                {item.is_private ? (
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    This submission is private and visible only to authorized administrators.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3 sm:col-span-2">
                  <button type="submit" className="btn btn-primary">Save changes</button>
                </div>
              </form>
              <form action={deletePrayerRequest}>
                <input type="hidden" name="admin_request_id" value={item.admin_request_id} />
                <button type="submit" className="btn btn-secondary">Delete submission</button>
              </form>
            </article>
          ))}
        </section>
      ) : !error ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          The inbox is empty. New enquiries and prayer requests submitted through the contact page will appear here.
        </p>
      ) : null}
    </main>
  );
}
