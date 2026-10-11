import { readdir } from "node:fs/promises";
import path from "node:path";
import { publicRoutes } from "@/lib/public-routes";
import { getPublicSupabaseClient } from "@/lib/public-supabase";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const imagesPerPage = 5;

async function readCmsGalleryImages(): Promise<string[]> {
  try {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("payload")
      .eq("kind", "gallery")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[public-gallery-backgrounds] Could not load CMS gallery images.", error);
      return [];
    }

    return data.flatMap((row) => {
      const payload = row.payload as Record<string, unknown>;
      const image = payload?.image;
      if (typeof image === "string" && image.trim()) {
        try {
          const url = new URL(image);
          return url.protocol === "https:" ? [image] : [];
        } catch {
          return [];
        }
      }
      return [];
    });
  } catch (error) {
    console.error("[public-gallery-backgrounds] CMS gallery images load failed.", error);
    return [];
  }
}

export async function getPublicGalleryBackgrounds() {
  const [localImages, cmsImages] = await Promise.all([
    (async () => {
      const galleryDirectory = path.join(process.cwd(), "public", "gallery");
      const entries = await readdir(galleryDirectory, { withFileTypes: true });
      return entries
        .filter(
          (entry) =>
            entry.isFile() &&
            imageExtensions.has(path.extname(entry.name).toLowerCase()),
        )
        .sort((left, right) =>
          left.name.localeCompare(right.name, "en", {
            numeric: true,
            sensitivity: "base",
          }),
        )
        .map((entry) => `/gallery/${encodeURIComponent(entry.name)}`);
    })(),
    readCmsGalleryImages(),
  ]);

  const allImages = [...cmsImages, ...localImages];

  const requiredImageCount = publicRoutes.length * imagesPerPage;
  if (allImages.length < requiredImageCount) {
    throw new Error(
      `Public gallery backgrounds require ${requiredImageCount} unique images; found ${allImages.length}.`,
    );
  }

  return publicRoutes.map((route, routeIndex) => ({
    route,
    items: allImages
      .slice(routeIndex * imagesPerPage, (routeIndex + 1) * imagesPerPage)
      .map((src) => ({
        kind: "image" as const,
        src,
        title: path.basename(src) || src,
        alt: "",
      })),
  }));
}
