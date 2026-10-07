import { SectionHeading } from "@/components/ui/section-heading";
import { LocalMediaGallery } from "@/components/local-media-gallery";
import { getLocalGalleryMedia } from "@/lib/local-gallery";

export default async function GalleryPage() {
  const mediaItems = await getLocalGalleryMedia();

  return (
    <main className="container space-y-10 py-20 sm:py-24">
      <section className="space-y-5 text-center">
        <SectionHeading
          title="Church gallery"
          subtitle="Browse photographs and videos in separate collections, with six items per page."
        />
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
          Please ask permission before reusing church media. Download controls are hidden where the
          browser supports it, but media displayed on the public web cannot be made impossible to
          save or capture.
        </p>
      </section>
      <LocalMediaGallery items={mediaItems} />
    </main>
  );
}
