import { StitchHomepage } from "@/components/stitch-homepage";
import { getHeroContent } from "@/lib/content";
import { getLocalGalleryMedia } from "@/lib/local-gallery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [mediaItems, heroContent] = await Promise.all([
    getLocalGalleryMedia(),
    getHeroContent(),
  ]);
  return (
    <>
      <StitchHomepage mediaItems={mediaItems} heroContent={heroContent} />
    </>
  );
}
