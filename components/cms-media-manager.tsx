"use client";

import { CmsMediaRowActions } from "@/components/cms-media-row-actions";
import { CmsMediaUploadDrawer } from "@/components/cms-media-upload-drawer";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Film, Music, X, Image as ImageIcon } from "lucide-react";
import type { MediaRow } from "@/lib/media-db";
import { getContextsThatWouldEmpty } from "@/lib/media-admin-client";

type BulkAction = "publish" | "unpublish" | "delete";

type BulkApiResult = {
  ok: string[];
  blocked: { id: string; reason: string }[];
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "image", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Document" },
];

const KIND_LABELS: Record<string, string> = {
  image: "Photo",
  video: "Video",
  audio: "Audio",
  document: "Document",
};

const QUICK_FILL_NOTES = [
  "No identifiable individuals — wide/crowd shot",
  "Public worship service — congregation photography",
  "Church event with public photography notice",
  "Member — no objection on record",
  "Under review — objection received",
];

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const labelClass = "block text-sm font-medium text-foreground";

function contextLabel(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "gallery") return "Gallery";
  if (lower === "homepage") return "Homepage";
  if (lower === "sermons") return "Sermons";
  if (!trimmed) return value;
  return trimmed.charAt(0).toLocaleUpperCase("en") + trimmed.slice(1);
}

function filenameFromSrc(src: string): string {
  try {
    const last = src.split("/").pop()?.split("?")[0] ?? "";
    return decodeURIComponent(last) || src;
  } catch {
    return src;
  }
}

function displayTitle(row: MediaRow): string {
  return row.title?.trim() || filenameFromSrc(row.src);
}

function hasConsentBasis(row: MediaRow): boolean {
  return Boolean(row.consent_notes && row.consent_notes.trim());
}

function parseTagsInput(value: string): string[] {
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (trimmed && !seen.has(trimmed)) seen.add(trimmed);
  }
  return [...seen];
}

export function CmsMediaManager({
  email,
  initialRows,
}: {
  email: string;
  initialRows: MediaRow[];
}) {
  const [rows, setRows] = useState<MediaRow[]>(initialRows);
  const [typeFilter, setTypeFilter] = useState("all");
  const [contextFilter, setContextFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<BulkAction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [deletingWithContexts, setDeletingWithContexts] = useState<string[] | null>(null);
  const [bulkDeleteConfirming, setBulkDeleteConfirming] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCaption, setDraftCaption] = useState("");
  const [draftAltText, setDraftAltText] = useState("");
  const [draftContexts, setDraftContexts] = useState<string[]>([]);
  const [draftNewContext, setDraftNewContext] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftSortOrder, setDraftSortOrder] = useState("0");
  const [draftPublished, setDraftPublished] = useState(true);
  const [draftConsentNotes, setDraftConsentNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [replaceFileInputRef, setReplaceFileInputRef] = useState<HTMLInputElement | null>(null);
  const [replacingFile, setReplacingFile] = useState<string | null>(null);
  const anchorRef = useRef<number | null>(null);
  const router = useRouter();

  const editingRow = useMemo(
    () => rows.find((row) => row.id === editingId) ?? null,
    [rows, editingId],
  );

  const knownContexts = useMemo(() => {
    const seen = new Set<string>();
    for (const row of rows) {
      for (const entry of row.context ?? []) {
        if (typeof entry === "string" && entry.trim()) seen.add(entry.trim());
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  }, [rows]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.kind !== typeFilter) return false;
      if (contextFilter !== "all" && !(row.context ?? []).includes(contextFilter)) return false;
      if (query) {
        const haystack = [row.title ?? "", row.src, (row.tags ?? []).join(" ")]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rows, typeFilter, contextFilter, search]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (editingId) {
        setEditingId(null);
        setDrawerError(null);
      } else {
        anchorRef.current = null;
        setSelected(new Set());
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editingId]);

  function handleCheckboxClick(
    event: React.MouseEvent<HTMLInputElement>,
    index: number,
    id: string,
  ) {
    event.stopPropagation();
    const next = new Set(selected);

    if (event.shiftKey && anchorRef.current !== null && visibleRows[anchorRef.current]) {
      const from = Math.min(anchorRef.current, index);
      const to = Math.max(anchorRef.current, index);
      for (let i = from; i <= to; i += 1) {
        const row = visibleRows[i];
        if (row) next.add(row.id);
      }
    } else if (event.metaKey || event.ctrlKey) {
      if (next.has(id)) next.delete(id);
      else next.add(id);
      anchorRef.current = index;
    } else {
      if (next.has(id) && next.size === 1) next.clear();
      else if (next.has(id)) next.delete(id);
      else next.add(id);
      anchorRef.current = index;
    }

    setSelected(next);
  }

  function selectAllVisible() {
    anchorRef.current = null;
    setSelected(new Set(visibleRows.map((row) => row.id)));
  }

  function clearSelection() {
    anchorRef.current = null;
    setSelected(new Set());
  }

  async function refreshRows(): Promise<MediaRow[] | null> {
    setRefreshing(true);
    try {
      const response = await fetch("/api/cms/media/list", { method: "GET" });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) {
        setError("The media library could not be refreshed. Please try again.");
        return null;
      }
      const data = (await response.json()) as MediaRow[];
      setRows(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (listError) {
      console.error("[cms-media] Could not refresh the media list.", listError);
      setError("The media library could not be refreshed. Please try again.");
      return null;
    } finally {
      setRefreshing(false);
    }
  }

  function summarizeBulkResult(result: BulkApiResult, action: BulkAction): string {
    const done = result.ok.length;
    const blockedCount = result.blocked.length;
    const verb =
      action === "publish"
        ? done === 1
          ? "Shown on the website: 1 item."
          : `Shown on the website: ${done} items.`
        : action === "unpublish"
          ? done === 1
            ? "Hidden from the website: 1 item."
            : `Hidden from the website: ${done} items.`
          : done === 1
            ? "Deleted: 1 item."
            : `Deleted: ${done} items.`;
    const blockedPart =
      blockedCount > 0
        ? blockedCount === 1
          ? " Kept 1 item."
          : ` Kept ${blockedCount} items.`
        : "";
    return `${verb}${blockedPart}`;
  }

  async function runBulkAction(action: BulkAction) {
    const ids = [...selected];
    if (ids.length === 0 || bulkBusy) return;

    if (action === "delete") {
      setBulkDeleteConfirming(ids.length);
      return;
    }

    setBulkBusy(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/cms/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) {
        setError("The bulk action could not be completed. Please try again.");
        return;
      }
      const result = (await response.json()) as BulkApiResult;
      const refreshed = await refreshRows();
      clearSelection();
      setMessage(summarizeBulkResult(result, action));
      if (result.blocked.length > 0 && refreshed) {
        const reasons = [...new Set(result.blocked.map((entry) => entry.reason))];
        setError(`Some items were kept: ${reasons.join(" ")}`);
      }
    } catch (bulkError) {
      console.error("[cms-media] The bulk action failed.", bulkError);
      setError("The bulk action could not be completed. Please try again.");
    } finally {
      setBulkBusy(null);
    }
  }

  function openDrawer(row: MediaRow) {
    setEditingId(row.id);
    setDrawerError(null);
    setDraftTitle(row.title ?? "");
    setDraftCaption(row.caption ?? "");
    setDraftAltText(row.alt_text ?? "");
    setDraftContexts([...(row.context ?? [])]);
    setDraftNewContext("");
    setDraftTags((row.tags ?? []).join(", "));
    setDraftSortOrder(String(row.sort_order ?? 0));
    setDraftPublished(row.published);
    setDraftConsentNotes(row.consent_notes ?? "");
    setReplacingFile(null);
  }

  function closeDrawer() {
    setEditingId(null);
    setDrawerError(null);
  }

  function toggleDraftContext(value: string) {
    setDraftContexts((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  }

  function addDraftContext() {
    const value = draftNewContext.trim();
    if (!value) return;
    setDraftContexts((current) => (current.includes(value) ? current : [...current, value]));
    setDraftNewContext("");
  }

  async function saveDrawer() {
    if (!editingRow || saving) return;

    const parsedSortOrder = Number.parseInt(draftSortOrder, 10);
    if (!Number.isFinite(parsedSortOrder)) {
      setDrawerError("Sort order must be a whole number.");
      return;
    }

    const cleanedContexts = [...new Set(draftContexts.map((entry) => entry.trim()).filter(Boolean))];
    if (cleanedContexts.length === 0) {
      setDrawerError("Choose at least one place where this item appears, or add a new one.");
      return;
    }

    setSaving(true);
    setDrawerError(null);

    try {
      const response = await fetch("/api/cms/media/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRow.id,
          patch: {
            title: draftTitle.trim() ? draftTitle.trim() : null,
            caption: draftCaption.trim() ? draftCaption.trim() : null,
            alt_text: draftAltText.trim() ? draftAltText.trim() : null,
            context: cleanedContexts,
            tags: parseTagsInput(draftTags),
            sort_order: parsedSortOrder,
            consent_notes:
              editingRow.kind === "image"
                ? draftConsentNotes.trim()
                  ? draftConsentNotes.trim()
                  : null
                : editingRow.consent_notes,
            published: draftPublished,
          },
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) {
        setDrawerError("The changes could not be saved. Please try again.");
        return;
      }
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setDrawerError(
          typeof data.error === "string" && data.error
            ? data.error
            : "The changes could not be saved. Please try again.",
        );
        return;
      }

      setRows((current) =>
        current.map((row) =>
          row.id === editingRow.id
            ? {
                ...row,
                title: draftTitle.trim() ? draftTitle.trim() : null,
                caption: draftCaption.trim() ? draftCaption.trim() : null,
                alt_text: draftAltText.trim() ? draftAltText.trim() : null,
                context: cleanedContexts,
                tags: parseTagsInput(draftTags),
                sort_order: parsedSortOrder,
                published: draftPublished,
                consent_notes:
                  editingRow.kind === "image"
                    ? draftConsentNotes.trim()
                      ? draftConsentNotes.trim()
                      : null
                    : row.consent_notes,
                updated_at: new Date().toISOString(),
              }
            : row,
        ),
      );
      setMessage("Saved. The list was updated without reloading the page.");
      closeDrawer();
    } catch (saveError) {
      console.error("[cms-media] Could not save the media item.", saveError);
      setDrawerError("The changes could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function renderCardMedia(row: MediaRow) {
    const title = displayTitle(row);
    if (row.kind === "image") {
      return (
        <img
          src={row.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-40 w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      );
    }
    if (row.kind === "video" && row.poster_src) {
      return (
        <img
          src={row.poster_src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-40 w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      );
    }
    const Icon = row.kind === "video" ? Film : row.kind === "audio" ? Music : FileText;
    return (
      <span className="flex h-40 w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
        <Icon size={36} aria-hidden="true" />
        <span className="px-3 text-center text-xs font-semibold">{title}</span>
      </span>
    );
  }

  async function togglePublished(row: { id: string; published: boolean; title?: string | null }) {
    const res = await fetch("/api/cms/media/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, patch: { published: !row.published } }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error ?? "Could not update visibility.");
      return;
    }
    await reloadRows();
  }

  function closeDeleteModals() {
    setPendingDelete(null);
    setDeletingWithContexts(null);
  }

  async function requestDelete(row: { id: string; title?: string | null }) {
    let contexts: string[] = [];
    try {
      contexts = await getContextsThatWouldEmpty([row.id]);
    } catch (error) {
      console.warn("[cms-media] context check failed; "
        + "showing plain delete confirm.", error);
    }
    setPendingDelete({ id: row.id, title: row.title ?? "this item" });
    setDeletingWithContexts(contexts.length > 0 ? contexts : null);
  }

  async function executeDelete(id: string) {
    try {
      const res = await fetch("/api/cms/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Delete failed.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("[cms-media] executeDelete failed.", error);
      setError("Delete request failed. Please try again.");
      return false;
    }
  }

  async function handleDeleteConfirmed() {
    if (!pendingDelete) return;
    try {
      const success = await executeDelete(pendingDelete.id);
      if (success) {
        await reloadRows();
      }
    } finally {
      closeDeleteModals();
    }
  }

  async function handleBulkDeleteConfirmed() {
    if (bulkDeleteConfirming === null) return;
    const ids = [...selected];
    if (ids.length === 0) return;

    setBulkBusy("delete");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/cms/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" as BulkAction, ids }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) {
        setError("The bulk delete could not be completed. Please try again.");
        return;
      }
      const result = (await response.json()) as BulkApiResult;
      const refreshed = await refreshRows();
      clearSelection();
      setMessage(summarizeBulkResult(result, "delete"));
      if (result.blocked.length > 0 && refreshed) {
        const reasons = [...new Set(result.blocked.map((entry) => entry.reason))];
        setError(`Some items were kept: ${reasons.join(" ")}`);
      }
    } catch (bulkError) {
      console.error("[cms-media] The bulk delete failed.", bulkError);
      setError("The bulk delete could not be completed. Please try again.");
    } finally {
      setBulkBusy(null);
      setBulkDeleteConfirming(null);
    }
  }

  async function reloadRows() {
    const refreshed = await fetch("/api/cms/media/list", { cache: "no-store" });
    if (refreshed.ok) setRows(await refreshed.json());
    router.refresh();
  }

  function requestReplace(row: MediaRow) {
    setEditingId(row.id);
    setDrawerError(null);
    setDraftTitle(row.title ?? "");
    setDraftCaption(row.caption ?? "");
    setDraftAltText(row.alt_text ?? "");
    setDraftContexts([...(row.context ?? [])]);
    setDraftNewContext("");
    setDraftTags((row.tags ?? []).join(", "));
    setDraftSortOrder(String(row.sort_order ?? 0));
    setDraftPublished(row.published);
    setDraftConsentNotes(row.consent_notes ?? "");
    setReplacingFile(row.id);
  }

  async function handleReplaceFile(event: React.ChangeEvent<HTMLInputElement>, rowId: string) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    event.currentTarget.value = "";
    setReplacingFile(null);
    setDrawerError(null);

    try {
      const supabase = (await import("@/utils/supabase/client")).createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const replaceResponse = await fetch("/api/cms/media/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rowId, newSrc: publicUrl }),
      });

      if (!replaceResponse.ok) {
        const json = await replaceResponse.json().catch(() => ({}));
        throw new Error(json?.error ?? "Replace failed");
      }

      setRows((current) =>
        current.map((row) =>
          row.id === rowId ? { ...row, src: publicUrl, updated_at: new Date().toISOString() } : row,
        ),
      );
      setMessage("File replaced. The list was updated without reloading the page.");
      
      // Refresh the editing drawer with updated src
      if (editingId === rowId) {
        const updatedRow = rows.find(r => r.id === rowId);
        if (updatedRow) {
          openDrawer({ ...updatedRow, src: publicUrl });
        }
      }
    } catch (error) {
      console.error("[cms-media] Could not replace file.", error);
      setDrawerError(error instanceof Error ? error.message : "The file could not be replaced. Please try again.");
    }
  }

  // Context display name helper
  function contextDisplayName(value: string): string {
    const trimmed = value.trim();
    const lower = trimmed.toLowerCase();
    if (lower === "gallery") return "Gallery";
    if (lower === "homepage") return "Homepage";
    if (lower === "sermons") return "Sermons";
    if (!trimmed) return value;
    return trimmed.charAt(0).toLocaleUpperCase("en") + trimmed.slice(1);
  }

  return (
    <main className="container space-y-8 py-16 sm:py-20">
      <header className="readable-surface flex flex-col gap-5 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Supabase CMS
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Media library</h1>
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "item" : "items"} in the library
            {refreshing ? " — refreshing…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/cms" className="btn btn-secondary">
            ← Content editor
          </Link>
          <Link href="/" className="btn btn-secondary">
            View website
          </Link>
        </div>
      </header>

      <section
        aria-label="Media filters"
        className="readable-surface flex flex-col gap-4 rounded-[2rem] p-6 sm:p-8"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr_auto]">
          <label className={labelClass}>
            Type
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={fieldClass}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Where it appears
            <select
              value={contextFilter}
              onChange={(event) => setContextFilter(event.target.value)}
              className={fieldClass}
            >
              <option value="all">All places</option>
              {knownContexts.map((entry) => (
                <option key={entry} value={entry}>
                  {contextLabel(entry)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Search
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, file, or tags…"
              className={fieldClass}
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="button" className="btn btn-primary" onClick={() => setUploadOpen(true)}>
              Upload media
            </button>
            <button type="button" className="btn btn-secondary" onClick={selectAllVisible}>
              Select all visible
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearSelection}>
              Clear selection
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          Showing {visibleRows.length} of {rows.length} {rows.length === 1 ? "item" : "items"}
          {selected.size > 0 ? ` — ${selected.size} selected` : ""}
        </p>
      </section>

      {selected.size > 0 ? (
        <section
          aria-label="Bulk actions"
          className="readable-surface flex flex-col gap-4 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <p className="text-base font-semibold text-foreground" role="status">
            {selected.size} selected
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-primary"
              disabled={bulkBusy !== null}
              onClick={() => void runBulkAction("publish")}
            >
              {bulkBusy === "publish" ? "Showing…" : "Show on website"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={bulkBusy !== null}
              onClick={() => void runBulkAction("unpublish")}
            >
              {bulkBusy === "unpublish" ? "Hiding…" : "Hide from website"}
            </button>
            <button
              type="button"
              className="btn border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-60"
              disabled={bulkBusy !== null}
              onClick={() => void runBulkAction("delete")}
            >
              {bulkBusy === "delete" ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      {visibleRows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {rows.length === 0
            ? "No media in the library yet."
            : "No media matches these filters. Try clearing the search or choosing a different type."}
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRows.map((row, index) => {
            const title = displayTitle(row);
            const needsReview = row.kind === "image" && row.published && !hasConsentBasis(row);
            const basisRecorded = row.kind === "image" && hasConsentBasis(row);
            const isSelected = selected.has(row.id);
            return (
              <li
                key={row.id}
                className={`overflow-hidden rounded-2xl border bg-card transition ${
                  isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    aria-label={`Select ${title}`}
                    onClick={(event) => handleCheckboxClick(event, index, row.id)}
                    onChange={() => {}}
                    className="absolute left-3 top-3 z-10 size-5 cursor-pointer accent-primary"
                  />
                  <CmsMediaRowActions
                    title={title}
                    published={row.published}
                    onEdit={() => openDrawer(row)}
                    onReplace={() => requestReplace(row)}
                    onTogglePublished={() => void togglePublished(row)}
                    onDelete={() => requestDelete(row)}
                  />
                  <button
                    type="button"
                    onClick={() => openDrawer(row)}
                    aria-label={`Edit ${title}`}
                    className="block w-full cursor-pointer text-left"
                  >
                    {renderCardMedia(row)}
                  </button>
                </div>
                <div className="space-y-2 p-4">
                  <button
                    type="button"
                    onClick={() => openDrawer(row)}
                    className="block w-full cursor-pointer text-left font-semibold text-foreground hover:text-primary"
                  >
                    <span className="block truncate">{title}</span>
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {KIND_LABELS[row.kind] ?? row.kind}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.published
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.published ? "Shown on website" : "Hidden"}
                    </span>
                    {needsReview ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Needs review
                      </span>
                    ) : null}
                    {basisRecorded ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">
                        Basis recorded
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(row.context ?? []).map((entry) => (
                      <span
                        key={entry}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {contextLabel(entry)}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated{" "}
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                      new Date(row.updated_at),
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {uploadOpen ? (
        <CmsMediaUploadDrawer
          onClose={() => setUploadOpen(false)}
          onUploaded={async () => {
            setUploadOpen(false);
            await reloadRows();
          }}
        />
      ) : null}

      {editingRow ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${displayTitle(editingRow)}`}
          onClick={closeDrawer}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  {KIND_LABELS[editingRow.kind] ?? editingRow.kind}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Edit media</h2>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  File: {editingRow.src}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close editor"
                className="btn btn-secondary shrink-0"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (replaceFileInputRef) {
                    replaceFileInputRef.click();
                  }
                }}
                className="btn btn-secondary"
              >
                Replace file
              </button>
              <input
                ref={setReplaceFileInputRef}
                type="file"
                onChange={(event) => void handleReplaceFile(event, editingRow.id)}
                style={{ display: "none" }}
                disabled={saving}
              />
            </div>

            <div className="mt-6 space-y-5">
              <label className={labelClass}>
                Title
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder={filenameFromSrc(editingRow.src)}
                  className={fieldClass}
                />
              </label>

              <label className={labelClass}>
                Caption
                <textarea
                  value={draftCaption}
                  onChange={(event) => setDraftCaption(event.target.value)}
                  rows={3}
                  className={fieldClass}
                />
              </label>

              <label className={labelClass}>
                Alt text
                <input
                  type="text"
                  value={draftAltText}
                  onChange={(event) => setDraftAltText(event.target.value)}
                  className={fieldClass}
                />
                <span className="mt-2 block text-xs text-muted-foreground">
                  Describe the image for screen readers and search engines
                </span>
              </label>

              <div>
                <span className={labelClass} id="media-where-label">
                  Where it appears
                </span>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-labelledby="media-where-label"
                >
                  {knownContexts.map((entry) => {
                    const active = draftContexts.includes(entry);
                    return (
                      <button
                        key={entry}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleDraftContext(entry)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {contextLabel(entry)}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={draftNewContext}
                    onChange={(event) => setDraftNewContext(event.target.value)}
                    placeholder="Add a new place, e.g. Youth"
                    aria-label="Add a new place where this item appears"
                    className={fieldClass}
                  />
                  <button type="button" onClick={addDraftContext} className="btn btn-secondary mt-2 shrink-0">
                    Add
                  </button>
                </div>
              </div>

              <label className={labelClass}>
                Tags
                <input
                  type="text"
                  value={draftTags}
                  onChange={(event) => setDraftTags(event.target.value)}
                  placeholder="worship, choir, easter"
                  className={fieldClass}
                />
                <span className="mt-2 block text-xs text-muted-foreground">
                  Separate tags with commas.
                </span>
              </label>

              <label className={labelClass}>
                Sort order
                <input
                  type="number"
                  value={draftSortOrder}
                  onChange={(event) => setDraftSortOrder(event.target.value)}
                  className={fieldClass}
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={draftPublished}
                  onChange={(event) => setDraftPublished(event.target.checked)}
                  className="size-5 accent-primary"
                />
                <span className="text-sm font-medium text-foreground">Show on website</span>
              </label>

              {editingRow.kind === "image" ? (
                <div>
                  <label className={labelClass} htmlFor="media-consent-notes">
                    Why we are allowed to publish this
                  </label>
                  <textarea
                    id="media-consent-notes"
                    value={draftConsentNotes}
                    onChange={(event) => setDraftConsentNotes(event.target.value)}
                    rows={3}
                    placeholder="Record the basis for publishing this photo…"
                    className={fieldClass}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_FILL_NOTES.map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => setDraftConsentNotes(note)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {drawerError ? (
                <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  {drawerError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void saveDrawer()}
                  disabled={saving}
                  className="btn btn-primary disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={closeDrawer} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Single Delete Confirmation Dialog - when deletion would empty a context */}
      {deletingWithContexts && deletingWithContexts.length > 0 ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm deletion"
          onClick={closeDeleteModals}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Confirm Delete
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Delete this item?</h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteModals}
                aria-label="Close dialog"
                className="btn btn-secondary shrink-0"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                This will leave the following section{deletingWithContexts.length > 1 ? "s" : ""} with 0 items on the public site:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {deletingWithContexts.map((ctx) => (
                  <li key={ctx} className="text-sm text-foreground">
                    {contextDisplayName(ctx)}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                The section may appear empty. Are you sure you want to delete this item?
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="btn border border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Delete anyway
              </button>
              <button
                type="button"
                onClick={closeDeleteModals}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirming !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm bulk deletion"
          onClick={() => setBulkDeleteConfirming(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Confirm Delete
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Delete {bulkDeleteConfirming} items?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirming(null)}
                aria-label="Close dialog"
                className="btn btn-secondary shrink-0"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete {bulkDeleteConfirming} {bulkDeleteConfirming === 1 ? "item" : "items"}? This cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleBulkDeleteConfirmed}
                className="btn border border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirming(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Single Delete Confirmation Dialog - immediate deletion (no context warning) */}
      {pendingDelete && deletingWithContexts === null ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm deletion"
          onClick={closeDeleteModals}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Confirm Delete
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Delete "{pendingDelete.title}"?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteModals}
                aria-label="Close dialog"
                className="btn btn-secondary shrink-0"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this item? This cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="btn border border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={closeDeleteModals}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
