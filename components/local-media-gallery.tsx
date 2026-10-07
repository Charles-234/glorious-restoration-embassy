"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { GalleryMediaItem } from "@/lib/local-gallery";

interface LocalMediaGalleryProps {
  items: GalleryMediaItem[];
  limit?: number;
}

export function LocalMediaGallery({ items, limit }: LocalMediaGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const allImages = items.filter((item) => item.kind === "image");
  const allVideos = items.filter((item) => item.kind === "video");
  const imageLimit =
    typeof limit === "number" ? Math.max(1, limit - Math.ceil(limit / 4)) : undefined;
  const videoLimit = typeof limit === "number" ? Math.ceil(limit / 4) : undefined;
  const images = allImages.slice(0, imageLimit);
  const videos = allVideos.slice(0, videoLimit);

  useEffect(() => {
    if (selectedImageIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (event.key === "ArrowLeft") {
        setSelectedImageIndex((index) =>
          index === null ? null : (index - 1 + images.length) % images.length,
        );
      } else if (event.key === "ArrowRight") {
        setSelectedImageIndex((index) =>
          index === null ? null : (index + 1) % images.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, selectedImageIndex]);

  return (
    <>
      {images.length > 0 && (
        <section className="space-y-6" aria-labelledby="photo-gallery-heading">
          <h2 id="photo-gallery-heading" className="text-2xl font-semibold text-foreground">
            Gallery
          </h2>
          <div className="gre-media-grid">
            {images.map((item, imageIndex) => (
              <article className="gre-media-card" key={item.src}>
                <button
                  type="button"
                  className="gre-media-visual gre-media-image-button"
                  style={{ backgroundColor: "hsl(var(--muted))" }}
                  aria-label={`View photo ${imageIndex + 1}`}
                  onClick={() => setSelectedImageIndex(imageIndex)}
                >
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    unoptimized
                    style={{ objectFit: "contain" }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="mt-12 space-y-6" aria-labelledby="video-gallery-heading">
          <h2 id="video-gallery-heading" className="text-2xl font-semibold text-foreground">
            Videos
          </h2>
          <div className="gre-media-grid">
            {videos.map((item, index) => (
              <article className="gre-media-card" key={item.src}>
                <div className="gre-media-visual">
                  <video controls preload="none" playsInline aria-label={`Play video ${index + 1}`}>
                    <source src={item.src} />
                    Your browser does not support embedded video.
                  </video>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedImageIndex !== null && images[selectedImageIndex] ? (
        <div
          className="gre-media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${selectedImageIndex + 1} of ${images.length}`}
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            type="button"
            className="gre-media-lightbox-close"
            aria-label="Close image viewer"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X size={24} />
          </button>
          <button
            type="button"
            className="gre-media-lightbox-previous"
            aria-label="Previous image"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedImageIndex((index) =>
                index === null ? null : (index - 1 + images.length) % images.length,
              );
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="gre-media-lightbox-image" onClick={(event) => event.stopPropagation()}>
            <Image
              src={images[selectedImageIndex].src}
              alt=""
              fill
              unoptimized
              style={{ objectFit: "contain" }}
              sizes="90vw"
            />
          </div>
          <button
            type="button"
            className="gre-media-lightbox-next"
            aria-label="Next image"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedImageIndex((index) =>
                index === null ? null : (index + 1) % images.length,
              );
            }}
          >
            <ArrowRight size={24} />
          </button>
        </div>
      ) : null}
    </>
  );
}
