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
  fade: styles.effectFade || "effectFade",
  wipe: styles.effectWipe || "effectWipe",
  zoom: styles.effectZoom || "effectZoom",
  drift: styles.effectDrift || "effectDrift",
};

const ROTATE_EVERY_MS = 5_000;   // change image every 5s
const ANIM_DURATION_MS = 1_500;  // animation duration

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

  // Main rotation loop
  useEffect(() => {
    if (items.length < 2) return;

    const tick = () => {
      if (busyRef.current) return;

      const nextIdx = (activeIdx + 1) % items.length;
      const effect = EFFECTS[cycleRef.current % EFFECTS.length];
      cycleRef.current += 1;
      busyRef.current = true;

      console.log("[bg] transition start", { from: activeIdx, to: nextIdx, effect });

      setIncoming({ idx: nextIdx, effect, key: cycleRef.current });

      setTimeout(() => {
        setActiveIdx(nextIdx);
        setIncoming(null);
        busyRef.current = false;
        console.log("[bg] transition committed", { active: nextIdx });
      }, ANIM_DURATION_MS);
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
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
          loading="eager"
          className={styles.image}
        />
      </div>

      {/* Incoming layer — animated on mount */}
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
