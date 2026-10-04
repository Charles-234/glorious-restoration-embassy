"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/lib/siteData";

const allPhotos = [
  "photo24.jpeg", "photo1.jpg", "photo2.jpg", "photo3.jpg", "photo4.jpg", "photo5.jpg", "photo6.jpg", "photo7.jpg", "photo8.jpg", "photo9.jpg", "photo10.jpeg", "photo11.jpeg", "photo12.jpeg", "photo13.jpeg", "photo14.jpeg", "photo17.jpeg", "photo18.jpeg", "photo22.jpeg", "photo23.jpeg", "photo27.jpeg", "photo28.jpeg", "photo29.jpeg", "photo30.jpeg", "photo31.jpeg", "photo32.jpeg", "photo33.jpeg", "photo34.jpeg", "photo35.jpeg", "photo36.jpeg"
];

export default function GalleryPage() {
  const [index, setIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const openAt = useCallback((i: number) => setIndex(i), []);
  const close = useCallback(() => setIndex(null), []);
  const showPrev = useCallback(() => setIndex((i) => (i === null ? null : (i - 1 + allPhotos.length) % allPhotos.length)), []);
  const showNext = useCallback(() => setIndex((i) => (i === null ? null : (i + 1) % allPhotos.length)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, showNext, showPrev]);

  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading title="Gallery" subtitle="Stories of worship, culture, and community captured in light and movement." />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">Experience the visual heart of {siteConfig.brandName} through photography that reflects our spiritual and cultural journey.</p>
      </section>

      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
        <Image src="/gallery/photo24.jpeg" alt="Featured gallery background" width={1600} height={520} className="h-[520px] w-full object-cover" />
        <div className="media-scrim absolute inset-0 flex items-end p-10">
          <div className="max-w-3xl text-overlay text-legible">
            <p className="text-sm uppercase tracking-[0.32em] text-brand-sky">Featured</p>
            <h2 className="mt-4 text-4xl font-semibold">A visible background moment of grace</h2>
          </div>
        </div>
      </section>

      <section className="space-y-16">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-foreground">Enduring God&apos;s Process</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            { ["photo1.jpg","photo2.jpg","photo3.jpg","photo4.jpg","photo5.jpg"].map((p, i) => (
              <button key={p} onClick={() => openAt(allPhotos.indexOf(p))} className="overflow-hidden rounded-3xl">
                <Image src={`/gallery/${p}`} alt="" width={520} height={320} className="h-48 w-full object-cover" />
              </button>
            )) }
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-foreground">Celebration</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            { ["photo6.jpg","photo7.jpg","photo8.jpg","photo9.jpg"].map((p) => (
              <button key={p} onClick={() => openAt(allPhotos.indexOf(p))} className="overflow-hidden rounded-3xl">
                <Image src={`/gallery/${p}`} alt="" width={520} height={320} className="h-48 w-full object-cover" />
              </button>
            )) }
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-foreground">Graduation of Pastor Steve Kariuki</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            { ["photo10.jpeg","photo11.jpeg","photo12.jpeg","photo13.jpeg","photo14.jpeg","photo17.jpeg","photo18.jpeg","photo34.jpeg","photo35.jpeg","photo36.jpeg"].map((p) => (
              <button key={p} onClick={() => openAt(allPhotos.indexOf(p))} className="overflow-hidden rounded-3xl">
                <Image src={`/gallery/${p}`} alt="" width={520} height={320} className="h-48 w-full object-cover" />
              </button>
            )) }
          </div>

          <div className="readable-surface rounded-[2rem] p-6">
            <p className="text-sm uppercase tracking-[0.32em] text-accent">Graduation story</p>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              This section now focuses on still photography only, keeping the gallery fast, calm, and visually consistent across every device.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {["photo34.jpeg", "photo35.jpeg", "photo36.jpeg"].map((p) => (
                <button key={p} onClick={() => openAt(allPhotos.indexOf(p))} className="overflow-hidden rounded-3xl">
                  <Image src={`/gallery/${p}`} alt="" width={520} height={320} className="h-48 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-foreground">Ceremonies & Guests</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            { ["photo22.jpeg","photo23.jpeg","photo27.jpeg","photo28.jpeg","photo29.jpeg","photo30.jpeg","photo31.jpeg","photo32.jpeg","photo33.jpeg"].map((p) => (
              <button key={p} onClick={() => openAt(allPhotos.indexOf(p))} className="overflow-hidden rounded-3xl">
                <Image src={`/gallery/${p}`} alt="" width={520} height={320} className="h-48 w-full object-cover" />
              </button>
            )) }
          </div>
        </div>
      </section>

      {index !== null ? (
        <div
          className="lightbox-scrim fixed inset-0 z-50 flex items-center justify-center"
          onTouchStart={(e) => setTouchStartX(e.touches?.[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const endX = e.changedTouches?.[0]?.clientX ?? null;
            if (touchStartX === null || endX === null) return;
            const diff = endX - touchStartX;
            if (diff > 60) showPrev();
            if (diff < -60) showNext();
            setTouchStartX(null);
          }}
        >
          <button onClick={close} className="absolute top-6 right-6 rounded-full bg-white/15 p-3 text-overlay">Close</button>
          <button onClick={showPrev} className="absolute left-6 rounded-full bg-white/15 p-3 text-overlay">◀</button>
          <Image src={`/gallery/${allPhotos[index]}`} alt="" width={1200} height={800} className="max-h-[85vh] max-w-[90vw] object-contain" />
          <button onClick={showNext} className="absolute right-6 rounded-full bg-white/15 p-3 text-overlay">▶</button>
        </div>
      ) : null}
    </main>
  );
}
