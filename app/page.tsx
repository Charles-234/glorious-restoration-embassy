import { StitchHomepage } from "@/components/stitch-homepage";
import { getHeroContent } from "@/lib/content";
import { getLocalGalleryMedia } from "@/lib/local-gallery";
import { getPastorPortraits, getGalleryItems } from "@/lib/siteData";
import type { PastorPortraitSlide } from "@/components/pastor-portrait-carousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [mediaItems, heroContent, pastorPortraits, stitchItems] = await Promise.all([
    getLocalGalleryMedia(),
    getHeroContent(),
    getPastorPortraits(),
    getGalleryItems(),
  ]);

  const portraitSlides: PastorPortraitSlide[] = pastorPortraits.map((p) => ({
    src: p.src,
    alt: p.alt,
    caption: p.caption,
  }));

  const stitchPhotos = stitchItems.map((item) => ({
    src: item.image,
    alt: item.title,
    title: item.title,
  }));

  return (
    <>
      <StitchHomepage
        mediaItems={mediaItems}
        heroContent={heroContent}
        portraitSlides={portraitSlides}
        stitchPhotos={stitchPhotos}
      />
    </>
  );
}
