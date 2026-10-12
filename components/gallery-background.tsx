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

const EFFECTS = ["fade", "wipe", "zoom", "drift"] as const;
type EffectKind = (typeof EFFECTS)[number];

const EFFECT_CLASS_MAP: Record<EffectKind, string> = {
  fade: styles.effectFade,
  wipe: styles.effectWipe,
  zoom: styles.effectZoom,
  drift: styles.effectDrift,
};

const ROTATE_EVERY_MS = 6_000;
const ANIM_DURATION_MS = 1_500;

export function GalleryBackground({
  items,
  className,
  intervalMs = ROTATE_EVERY_MS,
}: GalleryBackgroundProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [incoming, setIncoming] = useState<{ idx: number; effect: EffectKind; key: number } | null>(null);
  const busyRef = useRef(false);
  const cycleRef = useRef(0);

  // Reset when items change (route change)
  useEffect(() => {
    setActiveIdx(0);
    setIncoming(null);
    busyRef.current = false;
    cycleRef.current = 0;
  }, [items]);

  // Preload all images so they're ready when their turn comes
  useEffect(() => {
    for (const item of items) {
      if (item.kind === "image") {
        const img = new window.Image();
        img.src = item.src;
      }
    }
  }, [items]);

  // Main rotation loop — use setTimeout chain, not setInterval, so timing is exact
  useEffect(() => {
    if (items.length < 2) return;

    let timerId: number | null = null;
    let commitId: number | null = null;

    const scheduleNext = () => {
      timerId = window.setTimeout(() => {
        if (busyRef.current) {
          scheduleNext();
          return;
        }

        const nextIdx = (activeIdx + 1) % items.length;
        const effect = EFFECTS[cycleRef.current % EFFECTS.length];
        cycleRef.current += 1;
        busyRef.current = true;

        setIncoming({ idx: nextIdx, effect, key: cycleRef.current });

        commitId = window.setTimeout(() => {
          setActiveIdx(nextIdx);
          setIncoming(null);
          busyRef.current = false;
          scheduleNext();
        }, ANIM_DURATION_MS);
      }, intervalMs);
    };

    scheduleNext();

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      if (commitId !== null) window.clearTimeout(commitId);
    };
  }, [items, activeIdx, intervalMs]);

  if (items.length === 0) return null;

  const current = items[activeIdx] ?? items[0];
  const incomingItem = incoming ? items[incoming.idx] ?? null : null;

  return (
    <div aria-hidden="true" className={[styles.background, className].filter(Boolean).join(" ")}>
      {/* Base layer — always visible */}
      <div className={[styles.layer, styles.layerActive].join(" ")}>
        <Image
          src={current.src}
          alt=""
          fill
          sizes="100vw"
          unoptimized
          priority
          className={styles.image}
        />
      </div>

      {/* Incoming layer — keyed so React creates a fresh element each cycle */}
      {incoming && incomingItem && (
        <div
          key={incoming.key}
          className={[
            styles.layer,
            styles.layerIncoming,
            EFFECT_CLASS_MAP[incoming.effect],
          ].join(" ")}
        >
          <Image
            src={incomingItem.src}
            alt=""
            fill
            sizes="100vw"
            unoptimized
            loading="eager"
            className={styles.image}
          />
        </div>
      )}
    </div>
  );
}
