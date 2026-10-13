import { createClient } from "@/utils/supabase/client";
import type { MediaRow } from "@/lib/media-db";

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

function toMediaRows(data: unknown): MediaRow[] {
  if (!Array.isArray(data)) return [];
  return (data as MediaRow[]).map((row) => ({
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    context: Array.isArray(row.context) ? row.context : [],
  }));
}

export async function getContextsThatWouldEmpty(ids: string[]): Promise<string[]> {
  const uniqueIds = [...new Set(ids.filter((id) => typeof id === "string" && id))];
  if (uniqueIds.length === 0) return [];

  const supabase = createClient();

  // Get the rows being deleted
  const { data: targetData, error: targetError } = await supabase
    .from("media")
    .select("id,context,published")
    .in("id", uniqueIds);

  if (targetError) {
    console.error("[media-admin-client] Could not read media for empty context check.", targetError);
    return [];
  }

  const targets = toMediaRows(targetData);
  
  // Collect all contexts from the rows being deleted
  const contextsToCheck = new Set<string>();
  for (const row of targets) {
    for (const entry of cleanContextList(row.context)) {
      contextsToCheck.add(entry);
    }
  }

  if (contextsToCheck.size === 0) return [];

  // Get all published items and their contexts
  const { data: publishedData, error: countError } = await supabase
    .from("media")
    .select("id,context")
    .eq("published", true);

  if (countError) {
    console.error("[media-admin-client] Could not count published media for empty context check.", countError);
    return [];
  }

  const publishedRows = toMediaRows(publishedData);
  
  // Count published items per context (excluding the ones being deleted)
  const publishedCountByContext = new Map<string, number>();
  for (const row of publishedRows) {
    for (const entry of cleanContextList(row.context)) {
      publishedCountByContext.set(entry, (publishedCountByContext.get(entry) ?? 0) + 1);
    }
  }

  // Count how many published items being deleted per context
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

  // Find contexts that would have 0 published items after deletion
  const emptyContexts: string[] = [];
  for (const context of contextsToCheck) {
    const currentCount = publishedCountByContext.get(context) ?? 0;
    const beingDeleted = publishedBeingDeletedByContext.get(context) ?? 0;
    const remaining = currentCount - beingDeleted;
    if (remaining === 0) {
      emptyContexts.push(context);
    }
  }

  return emptyContexts;
}
