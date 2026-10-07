import { randomInt } from "node:crypto";
import { GalleryBackground } from "@/components/gallery-background";
import { StitchHomepage } from "@/components/stitch-homepage";
import { getHeroContent } from "@/lib/content";
import { getLocalGalleryMedia } from "@/lib/local-gallery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [mediaItems, heroContent] = await Promise.all([
    getLocalGalleryMedia(),
    getHeroContent(),
  ]);
  const backgroundImages = mediaItems.filter((item) => item.kind === "image");

  for (let index = backgroundImages.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);
    [backgroundImages[index], backgroundImages[randomIndex]] = [
      backgroundImages[randomIndex],
      backgroundImages[index],
    ];
  }

  return (
    <>
      <GalleryBackground items={backgroundImages.slice(0, 5)} />
      <StitchHomepage mediaItems={mediaItems} heroContent={heroContent} />
    </>
  );
}
