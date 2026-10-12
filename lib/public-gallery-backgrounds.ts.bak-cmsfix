import { readdir } from "node:fs/promises";
import path from "node:path";
import { publicRoutes } from "@/lib/public-routes";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const imagesPerPage = 5;

export async function getPublicGalleryBackgrounds() {
  const galleryDirectory = path.join(process.cwd(), "public", "gallery");
  const entries = await readdir(galleryDirectory, { withFileTypes: true });
  const images = entries
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

  const requiredImageCount = publicRoutes.length * imagesPerPage;
  if (images.length < requiredImageCount) {
    throw new Error(
      `Public gallery backgrounds require ${requiredImageCount} unique images; found ${images.length}.`,
    );
  }

  return publicRoutes.map((route, routeIndex) => ({
    route,
    items: images
      .slice(routeIndex * imagesPerPage, (routeIndex + 1) * imagesPerPage)
      .map((src) => ({
        kind: "image" as const,
        src,
        title: path.basename(src),
        alt: "",
      })),
  }));
}
