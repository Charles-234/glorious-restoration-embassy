import { getPublicSupabaseClient } from "@/lib/public-supabase";
import type { GalleryMediaItem } from "@/lib/local-gallery";

export type MediaKind = "image" | "video" | "audio" | "document";
export type MediaSource = "local" | "supabase-storage" | "youtube" | "external";

export type MediaRow = {
  id: string;
  kind: MediaKind;
  source: MediaSource;
  src: string;
  poster_src: string | null;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  tags: string[];
  context: string[];
  sort_order: number;
  published: boolean;
  consent_notes: string | null;
  created_at: string;
  updated_at: string;
};

function filenameFromSrc(src: string): string {
  try {
    const last = src.split("/").pop()?.split("?")[0] ?? "";
    return decodeURIComponent(last) || src;
  } catch {
    return src;
  }
}

export async function getMediaByContext(
  context: string,
  opts?: { kind?: MediaRow["kind"]; limit?: number },
): Promise<MediaRow[]> {
  try {
    const supabase = getPublicSupabaseClient();
    let query = supabase
      .from("media")
      .select("*")
      .eq("published", true)
      .contains("context", [context])
      .order("created_at", { ascending: false });

    if (opts?.kind) {
      query = query.eq("kind", opts.kind);
    }
    if (opts?.limit) {
      query = query.limit(opts.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[media-db] Could not read media by context.", error);
      return [];
    }
    return ((data ?? []) as MediaRow[]).map((row) => ({
      ...row,
      tags: row.tags ?? [],
      context: row.context ?? [],
    }));
  } catch (error) {
    console.error("[media-db] Could not read media by context.", error);
    return [];
  }
}

export function mediaRowToGalleryItem(row: MediaRow): GalleryMediaItem | null {
  const title = row.title?.trim() || filenameFromSrc(row.src);

  if (row.kind === "image") {
    return {
      kind: "image",
      src: row.src,
      title,
      alt: row.alt_text?.trim() || `Gallery image: ${title}`,
    };
  }

  if (row.kind === "video") {
    return {
      kind: "video",
      src: row.src,
      title,
      alt: row.alt_text?.trim() || `Gallery video: ${title}`,
      poster: row.poster_src ?? undefined,
    };
  }

  return null;
}

export async function getMediaAsGalleryItems(context: string): Promise<GalleryMediaItem[]> {
  const rows = await getMediaByContext(context);
  const items: GalleryMediaItem[] = [];
  for (const row of rows) {
    const item = mediaRowToGalleryItem(row);
    if (item) items.push(item);
  }
  return items;
}
