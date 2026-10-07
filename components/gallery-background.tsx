"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import type { GalleryMediaItem } from "@/lib/local-gallery";
import styles from "./gallery-background.module.css";

interface GalleryBackgroundProps {
  items: GalleryMediaItem[];
  className?: string;
  intervalMs?: number;
}

function chooseDifferentIndex(currentIndex: number, itemCount: number): number {
  if (itemCount < 2) {
    return currentIndex;
  }

  const randomIndex = Math.floor(Math.random() * (itemCount - 1));
  return randomIndex >= currentIndex ? randomIndex + 1 : randomIndex;
}

export function GalleryBackground({
  items,
  className,
  intervalMs = 8_000,
}: GalleryBackgroundProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeIndexRef = useRef(0);
  const incomingIndexRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  const finishTransition = useCallback(() => {
    const nextIndex = incomingIndexRef.current;
    if (nextIndex === null) {
      return;
    }

    activeIndexRef.current = nextIndex;
    incomingIndexRef.current = null;
    setActiveIndex(nextIndex);
    setIncomingIndex(null);
    setIsFading(false);
  }, []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const handleMotionPreferenceChange = () => {
      reducedMotionRef.current = reducedMotionQuery.matches;
      setPrefersReducedMotion(reducedMotionQuery.matches);

      if (reducedMotionQuery.matches) {
        incomingIndexRef.current = null;
        setIncomingIndex(null);
        setIsFading(false);
      }
    };

    handleMotionPreferenceChange();
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || items.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      if (incomingIndexRef.current !== null) {
        return;
      }

      const nextIndex = chooseDifferentIndex(activeIndexRef.current, items.length);
      incomingIndexRef.current = nextIndex;
      setIncomingIndex(nextIndex);
    }, Math.max(intervalMs, 1_000));

    return () => window.clearInterval(interval);
  }, [intervalMs, items.length, prefersReducedMotion]);

  const handleIncomingLoad = (index: number) => {
    if (incomingIndexRef.current !== index || reducedMotionRef.current) {
      if (
        incomingIndexRef.current === index &&
        reducedMotionRef.current
      ) {
        finishTransition();
      }
      return;
    }

    setIsFading(true);
  };

  const handleIncomingError = (index: number) => {
    if (incomingIndexRef.current !== index) {
      return;
    }

    incomingIndexRef.current = null;
    setIncomingIndex(null);
    setIsFading(false);
  };

  const handleIncomingTransitionEnd = (
    event: TransitionEvent<HTMLDivElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === "opacity"
    ) {
      finishTransition();
    }
  };

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[activeIndex] ?? items[0];

  return (
    <>
      <div
        aria-hidden="true"
        className={[styles.background, className].filter(Boolean).join(" ")}
      >
        <div
          className={[
            styles.layer,
            isFading ? styles.layerLeaving : styles.layerActive,
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
        {incomingIndex !== null && (
          <div
            className={[
              styles.layer,
              isFading ? styles.layerIncomingActive : styles.layerIncoming,
            ].join(" ")}
            onTransitionEnd={handleIncomingTransitionEnd}
          >
            <Image
              src={items[incomingIndex].src}
              alt=""
              fill
              sizes="100vw"
              unoptimized
              loading="lazy"
              className={styles.image}
              onLoad={() => handleIncomingLoad(incomingIndex)}
              onError={() => handleIncomingError(incomingIndex)}
            />
          </div>
        )}
      </div>
    </>
  );
}
