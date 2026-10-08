"use client";

import { usePathname } from "next/navigation";
import type { GalleryMediaItem } from "@/lib/local-gallery";
import { GalleryBackground } from "@/components/gallery-background";

interface PublicGalleryBackgroundProps {
  backgrounds: Array<{ route: string; items: GalleryMediaItem[] }>;
}

export function PublicGalleryBackground({
  backgrounds,
}: PublicGalleryBackgroundProps) {
  const pathname = usePathname() || "/";
  const route = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const background = backgrounds.find((entry) => entry.route === route);

  if (!background) return null;

  return (
    <GalleryBackground
      items={background.items}
      className="public-gallery-background"
    />
  );
}
