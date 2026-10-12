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

export function GalleryBackground({
  items,
  className,
  intervalMs = 4_000,
}: GalleryBackgroundProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * items.length);
        }
        return next;
      });
    }, Math.max(intervalMs, 2_000));

    return () => window.clearInterval(interval);
  }, [intervalMs, items.length]);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex] ?? items[0];

  return (
    <div
      aria-hidden="true"
      className={[styles.background, className].filter(Boolean).join(" ")}
    >
      <div className={[styles.layer, styles.layerActive].join(" ")}>
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
    </div>
  );
}
