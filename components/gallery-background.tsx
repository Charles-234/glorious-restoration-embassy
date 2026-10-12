"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { GalleryMediaItem } from "@/lib/local-gallery";
import styles from "./gallery-background.module.css";

interface GalleryBackgroundProps {
  items: GalleryMediaItem[];
  className?: string;
  intervalMs?: number;
}

const TRANSITION_KINDS = ["fade", "wipe", "zoom", "drift"] as const;
type TransitionKind = (typeof TRANSITION_KINDS)[number];

const EFFECT_CLASS: Record<TransitionKind, string> = {
  fade: styles.effectFade,
  wipe: styles.effectWipe,
  zoom: styles.effectZoom,
  drift: styles.effectDrift,
};

const DEFAULT_INTERVAL_MS = 6_000;
const MIN_INTERVAL_MS = 3_000;
const TRANSITION_DURATION_MS = 1_600;

interface IncomingSlide {
  id: number;
  index: number;
  kind: TransitionKind;
}

function chooseDifferentIndex(currentIndex: number, itemCount: number): number {
  if (itemCount < 2) return currentIndex;
  const randomIndex = Math.floor(Math.random() * (itemCount - 1));
  return randomIndex >= currentIndex ? randomIndex + 1 : randomIndex;
}

export function GalleryBackground({
  items,
  className,
  intervalMs = DEFAULT_INTERVAL_MS,
}: GalleryBackgroundProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [incoming, setIncoming] = useState<IncomingSlide | null>(null);
  const activeIndexRef = useRef(0);
  const incomingIndexRef = useRef<number | null>(null);
  const cycleRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = 0;
    incomingIndexRef.current = null;
    setActiveIndex(0);
    setIncoming(null);
  }, [items]);

  useEffect(() => {
    for (const item of items) {
      if (item.kind === "image") {
        const image = new window.Image();
        image.src = item.src;
      }
    }
  }, [items]);

  useEffect(() => {
    if (items.length < 2) return;

    let commitTimer: number | null = null;

    const tick = () => {
      if (incomingIndexRef.current !== null) return;

      const nextIndex = chooseDifferentIndex(activeIndexRef.current, items.length);
      if (nextIndex === activeIndexRef.current) return;

      const kind = TRANSITION_KINDS[cycleRef.current % TRANSITION_KINDS.length];
      cycleRef.current += 1;
      incomingIndexRef.current = nextIndex;
      setIncoming({ id: cycleRef.current, index: nextIndex, kind });

      commitTimer = window.setTimeout(() => {
        activeIndexRef.current = nextIndex;
        incomingIndexRef.current = null;
        setActiveIndex(nextIndex);
        setIncoming(null);
        commitTimer = null;
      }, TRANSITION_DURATION_MS);
    };

    const intervalId = window.setInterval(tick, Math.max(intervalMs, MIN_INTERVAL_MS));

    return () => {
      window.clearInterval(intervalId);
      if (commitTimer !== null) window.clearTimeout(commitTimer);
    };
  }, [intervalMs, items]);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex] ?? items[0];
  const incomingItem = incoming !== null ? items[incoming.index] ?? null : null;

  return (
    <div aria-hidden="true" className={[styles.background, className].filter(Boolean).join(" ")}>
      <div className={[styles.layer, styles.layerActive].join(" ")}>
        <Image src={currentItem.src} alt="" fill sizes="100vw" unoptimized loading="eager" className={styles.image} />
      </div>
      {incoming !== null && incomingItem !== null && (
        <div key={incoming.id} className={[styles.layer, styles.layerIncoming, EFFECT_CLASS[incoming.kind]].join(" ")}>
          <Image src={incomingItem.src} alt="" fill sizes="100vw" unoptimized loading="eager" className={styles.image} />
        </div>
      )}
      <div className={styles.overlay} />
    </div>
  );
}
