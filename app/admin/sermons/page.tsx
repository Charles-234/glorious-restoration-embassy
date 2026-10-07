import type { Metadata } from "next";
import Link from "next/link";
import { DeleteSermonForm } from "@/components/admin/delete-sermon-form";
import { saveSermon } from "@/app/admin/sermons/actions";
import { requireAdmin } from "@/lib/admin/require-admin";

export const metadata: Metadata = {
  title: "Manage sermons — Glorious Restoration Embassy",
  robots: { index: false, follow: false },
};

type SermonRecord = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  summary: string;
  thumbnail: string | null;
  video_url: string | null;
  audio_url: string | null;
  sort_order: number | null;
  scripture_refs: string[] | null;
  published: boolean | null;
};

type SermonsPageProps = {
  searchParams: Promise<{ edit?: string; error?: string; success?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Please check the required fields, URLs, date, and sort order.",
  save_failed: "The sermon could not be saved. Check the database setup and try again.",
  delete_failed: "The sermon could not be deleted. Check your access and try again.",
};

const successMessages: Record<string, string> = {
  created: "Sermon created.",
  updated: "Sermon updated.",
  deleted: "Sermon deleted.",
};

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(parsed);
}

function inputClassName() {
  return "mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25";
}

export default async function AdminSermonsPage({ searchParams }: SermonsPageProps) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data, error: queryError } = await supabase
    .from("sermons")
    .select(
      "id,title,speaker,date,summary,thumbnail,video_url,audio_url,sort_order,scripture_refs,published",
    )
    .order("date", { ascending: false });

  if (queryError) {
    console.error("[admin/sermons] Could not load sermons.", queryError);
  }

  const sermons = (data ?? []) as SermonRecord[];
  const editingSermon = params.edit
    ? sermons.find((sermon) => sermon.id === params.edit) ?? null
    : null;
  const errorMessage = errorMessages[params.error ?? ""];
  const successMessage = successMessages[params.success ?? ""];

  return (
    <main className="container space-y-8 py-10 sm:py-16">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Link
            href="/admin"
            className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            ← Admin dashboard
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Content management
          </p>
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Sermons
          </h1>
          <p className="text-sm text-muted-foreground">
            {sermons.length} {sermons.length === 1 ? "sermon" : "sermons"} in the library
          </p>
        </div>
        <form action="/admin/sign-out" method="post">
          <button type="submit" className="btn btn-secondary">
            Sign out
          </button>
        </form>
      </header>

      {queryError ? (
        <section
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm leading-6 text-foreground"
        >
          Sermons could not be loaded. Check the Supabase schema and administrator access.
        </section>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p role="status" className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm">
          {successMessage}
        </p>
      ) : null}
      {params.edit && !editingSermon ? (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          That sermon could not be found. Choose another sermon or create a new one.
        </p>
      ) : null}

      <section className="readable-surface rounded-[1.75rem] p-5 shadow-[var(--shadow-warm)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {editingSermon ? "Edit sermon" : "Add a sermon"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add the message details and choose whether it is visible on the public site.
            </p>
          </div>
          {editingSermon ? (
            <Link href="/admin/sermons" className="btn btn-secondary shrink-0">
              Cancel
            </Link>
          ) : null}
        </div>

        <form action={saveSermon} className="space-y-6">
          {editingSermon ? <input type="hidden" name="id" value={editingSermon.id} /> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              Sermon title
              <input
                className={inputClassName()}
                name="title"
                required
                maxLength={180}
                defaultValue={editingSermon?.title ?? ""}
                autoComplete="off"
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              Speaker
              <input
                className={inputClassName()}
                name="speaker"
                required
                maxLength={180}
                defaultValue={editingSermon?.speaker ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              Date preached
              <input
                className={inputClassName()}
                type="date"
                name="date"
                required
                defaultValue={editingSermon?.date ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              Sort order
              <input
                className={inputClassName()}
                type="number"
                name="sort_order"
                step="1"
                defaultValue={editingSermon?.sort_order ?? 0}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-foreground">
            Summary
            <textarea
              className={`${inputClassName()} min-h-32 resize-y`}
              name="summary"
              required
              maxLength={4000}
              defaultValue={editingSermon?.summary ?? ""}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              Video URL
              <input
                className={inputClassName()}
                type="url"
                name="video_url"
                placeholder="https://..."
                defaultValue={editingSermon?.video_url ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              Audio URL
              <input
                className={inputClassName()}
                type="url"
                name="audio_url"
                placeholder="https://..."
                defaultValue={editingSermon?.audio_url ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              Thumbnail URL
              <input
                className={inputClassName()}
                type="url"
                name="thumbnail"
                placeholder="https://..."
                defaultValue={editingSermon?.thumbnail ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              Scripture references
              <textarea
                className={`${inputClassName()} min-h-24 resize-y`}
                name="scripture_refs"
                placeholder="John 3:16, Romans 8:28"
                defaultValue={editingSermon?.scripture_refs?.join(", ") ?? ""}
              />
              <span className="mt-2 block font-normal text-muted-foreground">
                Separate references with commas or new lines.
              </span>
            </label>
          </div>

          <label className="flex w-fit items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground">
            <input
              className="size-4 accent-[hsl(var(--accent))]"
              type="checkbox"
              name="published"
              defaultChecked={editingSermon?.published ?? false}
            />
            Published on the public website
          </label>

          <button type="submit" className="btn btn-primary">
            {editingSermon ? "Save changes" : "Add sermon"}
          </button>
        </form>
      </section>

      <section aria-labelledby="sermon-list-heading" className="space-y-4">
        <div>
          <h2 id="sermon-list-heading" className="font-display text-2xl font-semibold text-foreground">
            Sermon library
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit details, change publication status, or remove a message.
          </p>
        </div>

        {queryError ? null : sermons.length ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-4">Sermon</th>
                    <th scope="col" className="px-5 py-4">Date</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    <th scope="col" className="px-5 py-4">Order</th>
                    <th scope="col" className="px-5 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sermons.map((sermon) => (
                    <tr key={sermon.id} className="align-middle">
                      <td className="max-w-md px-5 py-4">
                        <p className="font-semibold text-foreground">{sermon.title}</p>
                        <p className="mt-1 text-muted-foreground">{sermon.speaker}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {formatDate(sermon.date)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            sermon.published
                              ? "bg-accent/10 text-accent"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sermon.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{sermon.sort_order ?? 0}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/sermons?edit=${encodeURIComponent(sermon.id)}`}
                            className="rounded-xl border border-border px-3 py-2 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            Edit
                          </Link>
                          <DeleteSermonForm id={sermon.id} title={sermon.title} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="readable-surface rounded-[1.5rem] p-6 text-sm text-muted-foreground">
            No sermons have been added yet.
          </div>
        )}
      </section>
    </main>
  );
}
