"use client";

import Image from "next/image.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Play, X } from "lucide-react";
import type { GalleryMediaItem } from "@/lib/local-gallery";

interface LocalMediaGalleryProps {
  items: GalleryMediaItem[];
  limitPerKind?: number;
}

interface GalleryPaginationProps {
  label: string;
  currentPage: number;
  pageCount: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 6;

function DirectVideo({ item }: { item: GalleryMediaItem }) {
  const videoPath = item.src.split("?")[0].toLowerCase();
  const sourceType = videoPath.endsWith(".webm")
    ? "video/webm"
    : videoPath.endsWith(".mov")
      ? "video/quicktime"
      : "video/mp4";

  return (
    <video
      controls
      controlsList="nodownload"
      disablePictureInPicture
      preload={item.poster ? "none" : "metadata"}
      playsInline
      muted={false}
      poster={item.poster}
      aria-label="Play gallery video"
      onContextMenu={(event) => event.preventDefault()}
    >
      <source src={item.src} type={sourceType} />
      Your browser does not support embedded video.
    </video>
  );
}

function embedUrlWithPlayback(src: string): string {
  const url = new URL(src);
  url.searchParams.set("autoplay", "1");
  url.searchParams.set("mute", "0");
  url.searchParams.set("muted", "0");
  return url.toString();
}

function GalleryPagination({
  label,
  currentPage,
  pageCount,
  totalItems,
  onPageChange,
}: GalleryPaginationProps) {
  if (pageCount <= 1) return null;

  const firstItem = (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4" aria-label={`${label} pages`}>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {firstItem}–{lastItem} of {totalItems} {label.toLowerCase()}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Previous
        </button>
        <span className="text-sm font-semibold text-foreground" aria-current="page">
          {currentPage} / {pageCount}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage === pageCount}
        >
          Next <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export function LocalMediaGallery({ items, limitPerKind }: LocalMediaGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imagePage, setImagePage] = useState(1);
  const [videoPage, setVideoPage] = useState(1);
  const [playingEmbed, setPlayingEmbed] = useState<string | null>(null);
  const images = useMemo(
    () => items.filter((item) => item.kind === "image").slice(0, limitPerKind),
    [items, limitPerKind],
  );
  const videos = useMemo(
    () => items.filter((item) => item.kind !== "image").slice(0, limitPerKind),
    [items, limitPerKind],
  );
  const imagePageCount = Math.max(1, Math.ceil(images.length / PAGE_SIZE));
  const videoPageCount = Math.max(1, Math.ceil(videos.length / PAGE_SIZE));
  const activeImagePage = Math.min(imagePage, imagePageCount);
  const activeVideoPage = Math.min(videoPage, videoPageCount);
  const visibleImages = images.slice(
    (activeImagePage - 1) * PAGE_SIZE,
    activeImagePage * PAGE_SIZE,
  );
  const visibleVideos = videos.slice(
    (activeVideoPage - 1) * PAGE_SIZE,
    activeVideoPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedImageIndex(null);
      else if (event.key === "ArrowLeft") {
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

  function changePage(setPage: (page: number) => void, page: number) {
    setPage(page);
    setPlayingEmbed(null);
    galleryRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }

  return (
    <div
      ref={galleryRef}
      className="space-y-12"
      role="region"
      onContextMenu={(event) => event.preventDefault()}
      aria-label="Church photo and video gallery"
    >
      {images.length > 0 ? (
        <section className="space-y-5" aria-labelledby="gallery-photos-heading">
          <h2 id="gallery-photos-heading" className="font-display text-2xl font-semibold text-foreground">
            Photos
          </h2>
          <div className="gre-media-grid">
            {visibleImages.map((item) => {
              const imageIndex = images.indexOf(item);
              return (
                <article className="gre-media-card" key={item.src}>
                  <button
                    type="button"
                    className="gre-media-visual gre-media-image-button"
                    style={{ backgroundColor: "hsl(var(--muted))" }}
                    aria-label={`View gallery photo ${imageIndex + 1}`}
                    onClick={() => setSelectedImageIndex(imageIndex)}
                    draggable={false}
                  >
                    <Image
                      src={item.src}
                      alt="Church gallery photo"
                      fill
                      unoptimized
                      draggable={false}
                      style={{ objectFit: "contain" }}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </button>
                </article>
              );
            })}
          </div>
          <GalleryPagination
            label="Photos"
            currentPage={activeImagePage}
            pageCount={imagePageCount}
            totalItems={images.length}
            onPageChange={(page) => changePage(setImagePage, page)}
          />
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section className="space-y-5" aria-labelledby="gallery-videos-heading">
          <h2 id="gallery-videos-heading" className="font-display text-2xl font-semibold text-foreground">
            Videos
          </h2>
          <div className="gre-media-grid">
            {visibleVideos.map((item) => (
              <article className="gre-media-card" key={item.src}>
                <div className="gre-media-visual">
                  {item.kind === "embed" && playingEmbed !== item.src ? (
                    <button
                      type="button"
                      className="relative grid h-full w-full place-items-center overflow-hidden bg-primary text-primary-foreground"
                      aria-label="Play gallery video"
                      onClick={() => setPlayingEmbed(item.src)}
                    >
                      {item.poster ? (
                        <Image
                          src={item.poster}
                          alt=""
                          fill
                          unoptimized
                          draggable={false}
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : null}
                      <span className="relative z-10 grid size-14 place-items-center rounded-full bg-black/70 text-white">
                        <Play size={25} fill="currentColor" aria-hidden="true" />
                      </span>
                      <span className="sr-only">Start playback with audio controls available</span>
                    </button>
                  ) : item.kind === "embed" ? (
                    <iframe
                      src={embedUrlWithPlayback(item.src)}
                      title="Gallery video player"
                      allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <DirectVideo item={item} />
                  )}
                </div>
              </article>
            ))}
          </div>
          <GalleryPagination
            label="Videos"
            currentPage={activeVideoPage}
            pageCount={videoPageCount}
            totalItems={videos.length}
            onPageChange={(page) => changePage(setVideoPage, page)}
          />
        </section>
      ) : null}

      {images.length === 0 && videos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No gallery media is available yet.
        </p>
      ) : null}

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
              alt="Church gallery photo"
              fill
              unoptimized
              draggable={false}
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
    </div>
  );
}
