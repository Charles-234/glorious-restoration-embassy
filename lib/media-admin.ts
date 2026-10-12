import { createClient } from "@/utils/supabase/server";
import type { MediaRow } from "@/lib/media-db";

export type AdminResult = { ok: true } | { ok: false; error: string };

export type BulkBlockedItem = { id: string; reason: string };

export type BulkActionResult = { ok: string[]; blocked: BulkBlockedItem[] };

export type MediaUpdatePatch = {
  title?: string | null;
  caption?: string | null;
  alt_text?: string | null;
  tags?: string[];
  context?: string[];
  sort_order?: number;
  poster_src?: string | null;
  consent_notes?: string | null;
  published?: boolean;
};

const MEDIA_PATCH_KEYS = new Set([
  "title",
  "caption",
  "alt_text",
  "tags",
  "context",
  "sort_order",
  "poster_src",
  "consent_notes",
]);

const CONTEXT_DISPLAY_NAMES: Record<string, string> = {
  gallery: "Gallery",
  homepage: "Homepage",
  sermons: "Sermons",
};

function contextDisplayName(value: string): string {
  const trimmed = value.trim();
  const known = CONTEXT_DISPLAY_NAMES[trimmed.toLowerCase()];
  if (known) return known;
  if (!trimmed) return value;
  return trimmed.charAt(0).toLocaleUpperCase("en") + trimmed.slice(1);
}

function toMediaRows(data: unknown): MediaRow[] {
  if (!Array.isArray(data)) return [];
  return (data as MediaRow[]).map((row) => ({
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    context: Array.isArray(row.context) ? row.context : [],
  }));
}

function cleanContextList(context: unknown): string[] {
  if (!Array.isArray(context)) return [];
  const seen = new Set<string>();
  for (const entry of context) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (trimmed && !seen.has(trimmed)) seen.add(trimmed);
  }
  return [...seen];
}

export async function listAllMedia(): Promise<MediaRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[media-admin] Could not list media.", error);
    throw new Error("The media library could not be loaded. Please try again.");
  }

  return toMediaRows(data);
}

export async function updateMedia(id: string, patch: MediaUpdatePatch): Promise<AdminResult> {
  const supabase = await createClient();
  const cleanPatch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(patch ?? {})) {
    if (MEDIA_PATCH_KEYS.has(key)) {
      cleanPatch[key] = value;
    }
  }
  cleanPatch.updated_at = new Date().toISOString();

  const { error } = await supabase.from("media").update(cleanPatch).eq("id", id);

  if (error) {
    console.error("[media-admin] Could not update media.", error);
    return { ok: false, error: "The changes could not be saved. Please try again." };
  }
  return { ok: true };
}

export async function setPublished(
  id: string,
  published: boolean,
  consentNotes?: string,
): Promise<AdminResult> {
  // Advisory only: never block publishing on empty consent notes.
  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    published,
    updated_at: new Date().toISOString(),
  };

  if (published && consentNotes !== undefined) {
    patch.consent_notes = consentNotes;
  }

  const { error } = await supabase.from("media").update(patch).eq("id", id);

  if (error) {
    console.error("[media-admin] Could not change media visibility.", error);
    return { ok: false, error: "The website visibility could not be changed. Please try again." };
  }
  return { ok: true };
}

export async function bulkSetPublished(
  ids: string[],
  published: boolean,
): Promise<BulkActionResult> {
  const uniqueIds = [...new Set(ids.filter((id) => typeof id === "string" && id))];
  const ok: string[] = [];
  const blocked: BulkBlockedItem[] = [];

  for (const id of uniqueIds) {
    const result = await setPublished(id, published);
    if (result.ok) {
      ok.push(id);
    } else {
      blocked.push({ id, reason: result.error });
    }
  }

  return { ok, blocked };
}

export async function bulkDelete(ids: string[]): Promise<BulkActionResult> {
  const uniqueIds = [...new Set(ids.filter((id) => typeof id === "string" && id))];
  const ok: string[] = [];
  const blocked: BulkBlockedItem[] = [];

  if (uniqueIds.length === 0) return { ok, blocked };

  const supabase = await createClient();

  const { data: targetData, error: targetError } = await supabase
    .from("media")
    .select("id,published,context")
    .in("id", uniqueIds);

  if (targetError) {
    console.error("[media-admin] Could not read media before deleting.", targetError);
    return {
      ok,
      blocked: uniqueIds.map((id) => ({
        id,
        reason: "The item could not be checked before deleting. Please try again.",
      })),
    };
  }

  const targets = toMediaRows(targetData);
  const foundIds = new Set(targets.map((row) => row.id));
  for (const id of uniqueIds) {
    if (!foundIds.has(id)) {
      blocked.push({ id, reason: "This item no longer exists, so it was skipped." });
    }
  }

  const affectedContexts = new Set<string>();
  for (const row of targets) {
    for (const entry of cleanContextList(row.context)) {
      affectedContexts.add(entry);
    }
  }

  const { data: publishedData, error: countError } = await supabase
    .from("media")
    .select("id,context")
    .eq("published", true);

  if (countError) {
    console.error("[media-admin] Could not count published media before deleting.", countError);
    return {
      ok,
      blocked: [
        ...blocked,
        ...targets.map((row) => ({
          id: row.id,
          reason: "The item could not be checked before deleting. Please try again.",
        })),
      ],
    };
  }

  const publishedCountByContext = new Map<string, number>();
  for (const row of toMediaRows(publishedData)) {
    for (const entry of cleanContextList(row.context)) {
      publishedCountByContext.set(entry, (publishedCountByContext.get(entry) ?? 0) + 1);
    }
  }

  const publishedBeingDeletedByContext = new Map<string, number>();
  for (const row of targets) {
    if (!row.published) continue;
    for (const entry of cleanContextList(row.context)) {
      publishedBeingDeletedByContext.set(
        entry,
        (publishedBeingDeletedByContext.get(entry) ?? 0) + 1,
      );
    }
  }

  const fragileContexts = new Set<string>();
  for (const entry of affectedContexts) {
    const remaining =
      (publishedCountByContext.get(entry) ?? 0) -
      (publishedBeingDeletedByContext.get(entry) ?? 0);
    if (remaining < 3) fragileContexts.add(entry);
  }

  for (const row of targets) {
    const hit = cleanContextList(row.context).filter((entry) => fragileContexts.has(entry));

    if (hit.length > 0) {
      const names = [...new Set(hit.map(contextDisplayName))].join(" and ");
      blocked.push({
        id: row.id,
        reason: `${names} would have fewer than 3 items left on the website, so it was kept.`,
      });
      continue;
    }

    const { error: deleteError } = await supabase.from("media").delete().eq("id", row.id);

    if (deleteError) {
      console.error("[media-admin] Could not delete media.", deleteError);
      blocked.push({ id: row.id, reason: "The item could not be deleted. Please try again." });
    } else {
      ok.push(row.id);
    }
  }

  return { ok, blocked };
}

export async function bulkUpdateContext(
  ids: string[],
  contexts: string[],
  mode: "add" | "remove" | "replace",
): Promise<BulkActionResult> {
  const uniqueIds = [...new Set(ids.filter((id) => typeof id === "string" && id))];
  const ok: string[] = [];
  const blocked: BulkBlockedItem[] = [];

  if (uniqueIds.length === 0) return { ok, blocked };

  const cleanContexts = cleanContextList(contexts);
  const supabase = await createClient();

  const { data: targetData, error } = await supabase
    .from("media")
    .select("id,context")
    .in("id", uniqueIds);

  if (error) {
    console.error("[media-admin] Could not read media before updating where it appears.", error);
    return {
      ok,
      blocked: uniqueIds.map((id) => ({
        id,
        reason: "Where it appears could not be updated. Please try again.",
      })),
    };
  }

  const targets = toMediaRows(targetData);
  const foundIds = new Set(targets.map((row) => row.id));
  for (const id of uniqueIds) {
    if (!foundIds.has(id)) {
      blocked.push({ id, reason: "This item no longer exists, so it was skipped." });
    }
  }

  for (const row of targets) {
    const current = cleanContextList(row.context);
    let next: string[];

    if (mode === "replace") {
      next = cleanContexts;
    } else if (mode === "add") {
      next = [...new Set([...current, ...cleanContexts])];
    } else {
      const removing = new Set(cleanContexts);
      next = current.filter((entry) => !removing.has(entry));
    }

    const result = await updateMedia(row.id, { context: next });
    if (result.ok) {
      ok.push(row.id);
    } else {
      blocked.push({ id: row.id, reason: result.error });
    }
  }

  return { ok, blocked };
}

const MIN_PUBLISHED_PER_CONTEXT = 3;

export type DeleteResult =
  | { ok: true }
  | { ok: false; error: string; wouldDropBelowFloor?: boolean; affectedContext?: string; remaining?: number };

export async function deleteMedia(id: string, force = false): Promise<DeleteResult> {
  const supabase = await createClient();

  const { data: row, error: readErr } = await supabase
    .from("media")
    .select("id, context, published, title, src")
    .eq("id", id)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };
  if (!row) return { ok: false, error: "Media row not found." };

  // Min-count guard: if deleting this row would drop any context below the floor
  // of published items, block unless force=true.
  const contexts: string[] = Array.isArray(row.context) ? row.context : [];
  if (row.published && !force) {
    for (const ctx of contexts) {
      const { count, error: cntErr } = await supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .contains("context", [ctx]);
      if (cntErr) continue;
      const remaining = (count ?? 0) - 1;
      if (remaining < MIN_PUBLISHED_PER_CONTEXT) {
        return {
          ok: false,
          error: `Deleting this would leave only ${remaining} published item${remaining === 1 ? "" : "s"} in "${ctx}". Minimum is ${MIN_PUBLISHED_PER_CONTEXT}.`,
          wouldDropBelowFloor: true,
          affectedContext: ctx,
          remaining,
        };
      }
    }
  }

  const { error: delErr } = await supabase.from("media").delete().eq("id", id);
  if (delErr) return { ok: false, error: delErr.message };

  // Best-effort: if the row was uploaded to Supabase Storage, remove the file too.
  // Local files under /public are not affected.
  // (Skipped here — src could be a public path or external URL; deletion of the row
  //  is enough for the gallery to stop showing it. Files can be cleaned manually.)

  return { ok: true };
}
