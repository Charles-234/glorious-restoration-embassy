import { SectionHeading } from "@/components/ui/section-heading";
import { LocalMediaGallery } from "@/components/local-media-gallery";
import { getLocalGalleryMedia } from "@/lib/local-gallery";

export default async function GalleryPage() {
  const mediaItems = await getLocalGalleryMedia();

  return (
    <main className="container space-y-10 py-20 sm:py-24">
      <section className="space-y-5 text-center">
        <SectionHeading
          title="Gallery & Video Media Highlights"
          subtitle="Photos and videos from Glorious Restoration Embassy."
        />
      </section>
      <LocalMediaGallery items={mediaItems} />
    </main>
  );
}
