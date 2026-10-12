"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GalleryMediaItem } from "@/lib/local-gallery";
import styles from "./gallery-background.module.css";

interface GalleryBackgroundProps {
  items: GalleryMediaItem[];
  className?: string;
  intervalMs?: number;
}

const TRANSITIONS = [
  "fade",
  "wipeRight",
  "stripeMask",
  "zoomIn",
  "lightLeak",
] as const;

type TransitionKind = (typeof TRANSITIONS)[number];

export function GalleryBackground({
  items,
  className,
  intervalMs = 5_000,
}: GalleryBackgroundProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [transition, setTransition] = useState<TransitionKind>("fade");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (items.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * items.length);
        }

        // Set previous image and start transition
        setPrevIndex(current);
        setTransition(TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)]);
        setIsTransitioning(true);

        // End transition after animation completes
        window.setTimeout(() => {
          setIsTransitioning(false);
          setPrevIndex(null);
        }, 2200);

        return next;
      });
    }, Math.max(intervalMs, 3_000));

    return () => window.clearInterval(interval);
  }, [intervalMs, items.length]);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex] ?? items[0];
  const prevItem = prevIndex !== null ? items[prevIndex] : null;

  const wrapperClass = [
    styles.background,
    className,
    isTransitioning ? styles[`transition-${transition}`] : "",
  ].filter(Boolean).join(" ");

  return (
    <div aria-hidden="true" className={wrapperClass}>
      {prevItem && (
        <div className={[styles.layer, styles.layerPrev].join(" ")}>
          <Image
            src={prevItem.src}
            alt=""
            fill
            sizes="100vw"
            unoptimized
            loading="eager"
            className={styles.image}
          />
        </div>
      )}
      <div
        className={[
          styles.layer,
          styles.layerActive,
          isTransitioning ? styles.layerCurrentAnimating : "",
        ].join(" ")}
      >
        <Image
          src={currentItem.src}
          alt=""
          fill
          sizes="100vw"
          unoptimized
          loading="eager"
          className={styles.image}
        />
      </div>
      <div className={styles.overlay} />
    </div>
  );
}
