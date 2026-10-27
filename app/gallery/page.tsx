import Link from "next/link.js";
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
        <div className="flex justify-center pt-2">
          <Link
            href="/cms?kind=gallery"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background px-5 py-2 text-sm font-medium text-foreground hover:bg-primary hover:text-white transition-colors"
          >
            Manage Media (Admin)
          </Link>
        </div>
      </section>
      <LocalMediaGallery items={mediaItems} />
    </main>
  );
}
