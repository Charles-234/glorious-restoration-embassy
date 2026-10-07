import { readdir } from "node:fs/promises";
import path from "node:path";
import { reportSiteContentReadError } from "@/lib/cms-diagnostics";
import { getPublicSupabaseClient } from "@/lib/public-supabase";

export type GalleryMediaItem = {
  kind: "image" | "video";
  src: string;
  title: string;
  alt: string;
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

      return {
        kind,
        src: `/${publicPath}`,
        title,
        alt: `${kind === "image" ? "Gallery image" : "Gallery video"}: ${title}`,
      };
    })
    .sort((left, right) =>
      left.title.localeCompare(right.title, undefined, { numeric: true, sensitivity: "base" }),
    );
}

async function readCmsGalleryImages(): Promise<GalleryMediaItem[]> {
  try {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("title,payload")
      .eq("kind", "gallery")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      reportSiteContentReadError("published gallery images", error);
      return [];
    }

    return data.flatMap((row) => {
      const image = getCmsImageUrl(row.payload);
      if (!image) return [];
      return [{
        kind: "image" as const,
        src: image,
        title: row.title,
        alt: `Gallery image: ${row.title}`,
      }];
    });
  } catch (error) {
    console.error("[cms] Could not initialize Supabase for published gallery images.", error);
    return [];
  }
}

export async function getLocalGalleryMedia(): Promise<GalleryMediaItem[]> {
  const [rootImages, galleryImages, stitchImages, videos, cmsImages] = await Promise.all([
    readMediaDirectory("", "image"),
    readMediaDirectory("gallery", "image"),
    readMediaDirectory("stitch", "image"),
    readMediaDirectory("videos", "video"),
    readCmsGalleryImages(),
  ]);
  const images = [...cmsImages, ...rootImages, ...galleryImages, ...stitchImages];
  const videoInsertionPoints = videos.map((_, index) =>
    index === 0
      ? Math.min(4, images.length)
      : Math.round(4 + ((images.length - 4) * index) / videos.length),
  );
  const combined: GalleryMediaItem[] = [];
  let videoIndex = 0;

  images.forEach((image, index) => {
    combined.push(image);
    if (videoInsertionPoints[videoIndex] === index + 1) {
      combined.push(videos[videoIndex]);
      videoIndex += 1;
    }
  });

  combined.push(...videos.slice(videoIndex));
  return combined;
}
