import { readdir } from "node:fs/promises";
import path from "node:path";
import { reportSiteContentReadError } from "@/lib/cms-diagnostics";
import { getMediaAsGalleryItems } from "@/lib/media-db";
import { getPublicSupabaseClient } from "@/lib/public-supabase";

export type GalleryMediaItem = {
  kind: "image" | "video" | "embed";
  src: string;
  title: string;
  alt: string;
  poster?: string;
};

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const videoExtensions = new Set([".mp4", ".webm", ".mov"]);

function getCmsImageUrl(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("image" in payload)) return null;
  const image = payload.image;
  if (typeof image !== "string" || !image.trim()) return null;

  try {
    const url = new URL(image);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function getCmsVideoMedia(payload: unknown, title: string): GalleryMediaItem | null {
  if (typeof payload !== "object" || payload === null || !("videoUrl" in payload)) return null;
  const videoUrl = payload.videoUrl;
  if (typeof videoUrl !== "string" || !videoUrl.trim()) return null;
  const videoPoster = "videoPoster" in payload ? getCmsImageUrl({ image: payload.videoPoster }) ?? undefined : undefined;

  try {
    const url = new URL(videoUrl);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
      const videoId = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
      if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
      return {
        kind: "embed",
        src: `https://www.youtube-nocookie.com/embed/${videoId}`,
        title,
        alt: `Gallery video: ${title}`,
        poster: videoPoster ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const videoId = url.pathname.split("/").filter(Boolean).pop();
      if (!videoId || !/^\d+$/.test(videoId)) return null;
      return {
        kind: "embed",
        src: `https://player.vimeo.com/video/${videoId}`,
        title,
        alt: `Gallery video: ${title}`,
        poster: videoPoster,
      };
    }

    if (!videoExtensions.has(path.extname(url.pathname).toLowerCase())) return null;
    return {
      kind: "video",
      src: url.toString(),
      title,
      alt: `Gallery video: ${title}`,
      poster: videoPoster,
    };
  } catch {
    return null;
  }
}

async function readMediaDirectory(
  directory: string,
  kind: GalleryMediaItem["kind"],
): Promise<GalleryMediaItem[]> {
  const publicDirectory = path.join(process.cwd(), "public", directory);
  const entries = await readdir(publicDirectory, { withFileTypes: true });
  const extensions = kind === "image" ? imageExtensions : videoExtensions;

  return entries
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
    .filter((entry) => !/logo/i.test(entry.name))
    .map((entry) => {
      const publicPath = [directory, encodeURIComponent(entry.name)].filter(Boolean).join("/");
      const title = entry.name;

      const item: GalleryMediaItem = {
        kind,
        src: `/${publicPath}`,
        title,
        alt: `${kind === "image" ? "Gallery image" : "Gallery video"}: ${title}`,
      };
      if (kind === "video") {
        item.poster = `/${directory}/posters/${encodeURIComponent(path.parse(entry.name).name)}.jpg`;
      }
      return item;
    })
    .sort((left, right) =>
      left.title.localeCompare(right.title, undefined, { numeric: true, sensitivity: "base" }),
    );
}

async function readCmsGalleryMedia(): Promise<GalleryMediaItem[]> {
  try {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("title,payload")
      .eq("kind", "gallery")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      reportSiteContentReadError("published gallery media", error);
      return [];
    }

    return data.flatMap((row) => {
      const image = getCmsImageUrl(row.payload);
      const media: GalleryMediaItem[] = [];
      if (image) {
        media.push({
          kind: "image",
          src: image,
          title: row.title,
          alt: `Gallery image: ${row.title}`,
        });
      }
      const video = getCmsVideoMedia(row.payload, row.title);
      if (video) media.push(video);
      return media;
    });
  } catch (error) {
    console.error("[cms] Could not initialize Supabase for published gallery media.", error);
    return [];
  }
}

export async function getLocalGalleryMedia(): Promise<GalleryMediaItem[]> {
  const mediaTableItems = await getMediaAsGalleryItems("gallery");

  if (mediaTableItems.length > 0) {
    return mediaTableItems;
  }

  console.warn("[local-gallery] media table returned 0 rows for context 'gallery'; falling back to legacy sources.");

  const [galleryImages, videos, cmsMedia] = await Promise.all([
    readMediaDirectory("gallery", "image"),
    readMediaDirectory("videos", "video"),
    readCmsGalleryMedia(),
  ]);

  const existing: GalleryMediaItem[] = [
    ...cmsMedia.filter((item) => item.kind === "image"),
    ...galleryImages,
    ...cmsMedia.filter((item) => item.kind !== "image"),
    ...videos,
  ];

  return existing;
}
