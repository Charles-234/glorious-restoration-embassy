"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  cmsCollections,
  settingFields,
  type CmsField,
  type CmsKind,
} from "@/lib/cms-content";
import { createClient } from "@/utils/supabase/client";

type CmsRecord = {
  id: string;
  kind: CmsKind;
  slug: string;
  title: string;
  payload: Record<string, unknown>;
  published: boolean;
  updated_at: string;
};

const settingOptions = [
  { slug: "hero", label: "Homepage hero" },
  { slug: "pastor", label: "Pastor profile" },
  { slug: "donation", label: "Giving section" },
] as const;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function settingLabel(slug: string): string {
  return settingOptions.find((item) => item.slug === slug)?.label ?? slug;
}

async function captureVideoPoster(file: File): Promise<Blob | null> {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.muted = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("The video could not be decoded for its thumbnail."));
      video.load();
    });

    const captureTime = Number.isFinite(video.duration) && video.duration > 1
      ? Math.min(1, video.duration / 2)
      : 0;
    if (captureTime > 0) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("The video thumbnail frame could not be selected."));
        video.currentTime = captureTime;
      });
    }

    if (!video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

export function CmsWorkspace({
  email,
  initialKind = "sermon",
}: {
  email: string;
  initialKind?: CmsKind;
}) {
  const router = useRouter();
  const [records, setRecords] = useState<CmsRecord[]>([]);
  const [kind, setKind] = useState<CmsKind>(initialKind);
  const [settingSlug, setSettingSlug] = useState<string>("hero");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<Record<string, string | boolean>>({});
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields: CmsField[] = useMemo(() => {
    if (kind === "setting") return settingFields[settingSlug] ?? [];
    return cmsCollections.find((collection) => collection.kind === kind)?.fields ?? [];
  }, [kind, settingSlug]);

  const visibleRecords = useMemo(
    () => records.filter((record) => record.kind === kind),
    [kind, records],
  );

  async function loadRecords() {
    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("site_content")
        .select("id,kind,slug,title,payload,published,updated_at")
        .order("updated_at", { ascending: false });

      if (queryError) {
        console.error("[cms] Could not load editorial content.", queryError);
        setError("Content could not be loaded. Check the Supabase CMS migration and access policies.");
        return;
      }

      setError(null);
      setRecords((data ?? []) as CmsRecord[]);
    } catch (requestError) {
      console.error("[cms] Could not load editorial content.", requestError);
      setError("Content could not be loaded. Check your connection and Supabase CMS setup.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadRecords(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function resetForm(nextKind = kind, nextSettingSlug = settingSlug) {
    setKind(nextKind);
    setSettingSlug(nextSettingSlug);
    setEditingId(null);
    setTitle("");
    setPayload(nextKind === "announcement" ? { active: true } : {});
    setPublished(nextKind === "setting");
    setError(null);
    setMessage(null);
  }

  function chooseCollection(nextKind: CmsKind) {
    resetForm(nextKind, nextKind === "setting" ? "hero" : settingSlug);
  }

  function chooseSetting(nextSlug: string) {
    setSettingSlug(nextSlug);
    const existing = records.find(
      (record) => record.kind === "setting" && record.slug === nextSlug,
    );
    setEditingId(existing?.id ?? null);
    setTitle(settingLabel(nextSlug));
    setPayload(
      existing
        ? (existing.payload as Record<string, string | boolean>)
        : {},
    );
    setPublished(true);
    setError(null);
    setMessage(null);
  }

  function editRecord(record: CmsRecord) {
    setKind(record.kind);
    if (record.kind === "setting") setSettingSlug(record.slug);
    setEditingId(record.id);
    setTitle(record.title);
    setPayload(record.payload as Record<string, string | boolean>);
    setPublished(record.published);
    setError(null);
    setMessage(null);
  }

  function setField(name: string, value: string | boolean) {
    setPayload((current) => ({ ...current, [name]: value }));
  }

  async function uploadMedia(
    event: ChangeEvent<HTMLInputElement>,
    fieldName: string,
    mediaKind: "image" | "video",
  ) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const validType = mediaKind === "image"
      ? file.type.startsWith("image/")
      : ["video/mp4", "video/webm"].includes(file.type);
    if (!validType) {
      setError(mediaKind === "image" ? "Choose an image file." : "Choose an MP4 or WebM video.");
      return;
    }
    const maxBytes = mediaKind === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(mediaKind === "image"
        ? "Images must be 10 MB or smaller."
        : "Videos must be 50 MB or smaller.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    if (mediaKind === "video") setField("videoPoster", "");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${crypto.randomUUID()}-${safeName}`;
    try {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error(`[cms] ${mediaKind} upload failed.`, uploadError);
        setError(`The ${mediaKind} upload failed. Check the media bucket and administrator storage policies.`);
        return;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(filePath);
      setField(fieldName, data.publicUrl);
      if (mediaKind === "video") {
        try {
          const poster = await captureVideoPoster(file);
          if (poster) {
            const posterPath = `posters/${crypto.randomUUID()}.jpg`;
            const { error: posterError } = await supabase.storage
              .from("media")
              .upload(posterPath, poster, { contentType: "image/jpeg", upsert: false });
            if (posterError) throw posterError;
            const posterUrl = supabase.storage.from("media").getPublicUrl(posterPath).data.publicUrl;
            setField("videoPoster", posterUrl);
          }
        } catch (posterError) {
          console.error("[cms] Could not generate or upload the video thumbnail.", posterError);
          setMessage("Video uploaded. Its thumbnail could not be generated; the item can still be saved.");
          return;
        }
      }
      setMessage(`${mediaKind === "image" ? "Image" : "Video"} uploaded. Save the content item to publish it.`);
    } catch (uploadError) {
      console.error(`[cms] ${mediaKind} upload request failed.`, uploadError);
      setError(`The ${mediaKind} upload could not reach Supabase Storage.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    for (const field of fields) {
      const value = payload[field.name];
      if (field.required && (typeof value !== "string" || !value.trim())) {
        setError(`${field.label} is required.`);
        return;
      }
    }

    const contentTitle = kind === "setting" ? settingLabel(settingSlug) : title.trim();
    if (kind !== "setting" && !contentTitle) {
      setError("A title is required.");
      return;
    }
    if (kind === "gallery" && !payload.image && !payload.videoUrl) {
      setError("Add a photo or video before saving this gallery item.");
      return;
    }

    const slug = kind === "setting"
      ? settingSlug
      : editingId
        ? records.find((record) => record.id === editingId)?.slug ?? slugify(contentTitle)
        : slugify(contentTitle);
    if (!slug) {
      setError("The title must include at least one letter or number.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const values = {
      kind,
      slug,
      title: contentTitle,
      payload,
      published: kind === "setting" || published,
      updated_at: new Date().toISOString(),
    };
    const result = editingId
      ? await supabase.from("site_content").update(values).eq("id", editingId)
      : await supabase.from("site_content").insert(values);

    if (result.error) {
      console.error("[cms] Saving editorial content failed.", result.error);
      setError("Content could not be saved. Check for a duplicate title or a Supabase policy error.");
      setSaving(false);
      return;
    }

    await loadRecords();
    setEditingId(null);
    setTitle("");
    setPayload(kind === "announcement" ? { active: true } : {});
    setPublished(kind === "setting");
    setMessage(kind === "setting" ? "Site setting saved." : "Content saved.");
    setSaving(false);
    router.refresh();
  }

  async function deleteRecord() {
    if (!editingId || !window.confirm("Delete this content item? This cannot be undone.")) return;

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("site_content")
      .delete()
      .eq("id", editingId);

    if (deleteError) {
      console.error("[cms] Deleting editorial content failed.", deleteError);
      setError("The content item could not be deleted.");
      setSaving(false);
      return;
    }

    resetForm();
    setMessage("Content deleted.");
    await loadRecords();
    setSaving(false);
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("[cms] Sign-out failed.", signOutError);
      setError("Could not sign out. Please try again.");
      return;
    }
    router.push("/login?next=%2Fcms");
    router.refresh();
  }

  function renderField(field: CmsField) {
    const value = payload[field.name];
    const common = {
      id: `cms-${field.name}`,
      name: field.name,
      required: field.required,
      className:
        "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
    };

    if (field.type === "checkbox") {
      return (
        <label key={field.name} className="flex items-center gap-3 text-sm text-foreground">
          <input
            id={common.id}
            type="checkbox"
            checked={value === true}
            onChange={(event) => setField(field.name, event.target.checked)}
            className="size-5 accent-primary"
          />
          {field.label}
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.name} htmlFor={common.id} className="block text-sm font-medium text-foreground">
          {field.label}
          <textarea
            {...common}
            rows={4}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setField(field.name, event.target.value)}
          />
        </label>
      );
    }

    if (field.type === "image" || field.type === "video") {
      const isImage = field.type === "image";
      return (
        <label key={field.name} htmlFor={common.id} className="block text-sm font-medium text-foreground">
          {field.label}
          <input
            {...common}
            type="url"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setField(field.name, event.target.value)}
            placeholder={isImage ? "https://…" : "https://… (or upload MP4/WebM)"}
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            Or upload {isImage ? "an image (10 MB max)" : "an MP4/WebM video (50 MB max)"}.
          </span>
          <input
            type="file"
            accept={isImage ? "image/*" : "video/mp4,video/webm"}
            disabled={saving}
            onChange={(event) => void uploadMedia(event, field.name, isImage ? "image" : "video")}
            className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-secondary-foreground"
          />
        </label>
      );
    }

    return (
      <label key={field.name} htmlFor={common.id} className="block text-sm font-medium text-foreground">
        {field.label}
        <input
          {...common}
          type={field.type}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => setField(field.name, event.target.value)}
        />
      </label>
    );
  }

  return (
    <main className="container space-y-8 py-16 sm:py-20">
      <header className="readable-surface flex flex-col gap-5 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Supabase CMS</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Content management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/cms/media" className="btn btn-secondary">Media library</Link>
          <Link href="/" className="btn btn-secondary">View website</Link>
          <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <nav aria-label="Content collections" className="flex flex-wrap gap-2">
        {cmsCollections.map((collection) => (
          <button
            key={collection.kind}
            type="button"
            aria-pressed={kind === collection.kind}
            onClick={() => chooseCollection(collection.kind)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              kind === collection.kind
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {collection.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <section className="readable-surface rounded-[2rem] p-6 sm:p-8" aria-labelledby="cms-editor-title">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id="cms-editor-title" className="text-2xl font-semibold text-foreground">
                {editingId ? "Edit content" : "Create content"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {kind === "setting" ? "Site settings publish immediately." : "Save as a draft or publish to the website."}
              </p>
            </div>
            {editingId && (
              <button type="button" className="cta-link" onClick={() => resetForm()}>
                New item
              </button>
            )}
          </div>

          {kind === "setting" && (
            <div className="mb-5 space-y-4">
              <label htmlFor="cms-setting" className="block text-sm font-medium text-foreground">
                Setting
                <select
                  id="cms-setting"
                  value={settingSlug}
                  onChange={(event) => chooseSetting(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground"
                >
                  {settingOptions.map((option) => (
                    <option key={option.slug} value={option.slug}>{option.label}</option>
                  ))}
                </select>
              </label>
              <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">What these settings change:</strong>{" "}
                Homepage hero controls the front-page heading, introduction, and two call-to-action
                labels. Pastor profile updates the pastor name, title, biography, portrait, and
                contact email. Giving section changes the giving page heading, description, and
                button label. Saving a setting publishes it immediately; use the matching public
                page to confirm the result.
              </p>
            </div>
          )}

          <form onSubmit={(event) => void saveRecord(event)} className="space-y-5">
            {kind !== "setting" && (
              <label htmlFor="cms-title" className="block text-sm font-medium text-foreground">
                Title
                <input
                  id="cms-title"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            )}

            {fields.map(renderField)}

            {kind !== "setting" && (
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) => setPublished(event.target.checked)}
                  className="size-5 accent-primary"
                />
                Publish on the public website
              </label>
            )}

            {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm text-foreground">{message}</p>}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">
                {saving ? "Saving…" : published || kind === "setting" ? "Save and publish" : "Save draft"}
              </button>
              {editingId && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void deleteRecord()}
                  className="btn border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="readable-surface rounded-[2rem] p-6 sm:p-8" aria-labelledby="cms-items-title">
          <h2 id="cms-items-title" className="text-2xl font-semibold text-foreground">
            {kind === "setting" ? "Saved settings" : `${cmsCollections.find((item) => item.kind === kind)?.label} items`}
          </h2>
          {loading ? (
            <p role="status" className="mt-5 text-sm text-muted-foreground">Loading content…</p>
          ) : error && !records.length ? (
            <p className="mt-5 text-sm text-destructive">{error}</p>
          ) : visibleRecords.length ? (
            <ul className="mt-5 space-y-3">
              {visibleRecords.map((record) => (
                <li key={record.id}>
                  <button
                    type="button"
                    aria-current={editingId === record.id ? "true" : undefined}
                    onClick={() => editRecord(record)}
                    className="w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-foreground">{record.title}</span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        record.published
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {record.published ? "Published" : "Draft"}
                      </span>
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(record.updated_at))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No saved {kind === "setting" ? "settings" : "items"} in this collection yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
