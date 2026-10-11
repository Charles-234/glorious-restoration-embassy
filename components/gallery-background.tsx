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
  intervalMs = 5_000,
}: GalleryBackgroundProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeIndexRef = useRef(0);
  const incomingIndexRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const incomingLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    console.log("[gallery-bg] effect running", {
      prefersReducedMotion,
      itemCount: items.length,
      intervalMs,
    });

    if (prefersReducedMotion || items.length < 2) {
      console.log("[gallery-bg] rotation disabled", {
        reason: prefersReducedMotion ? "prefers-reduced-motion" : "not enough items",
      });
      return;
    }

    const interval = window.setInterval(() => {
      if (incomingIndexRef.current !== null) {
        console.log("[gallery-bg] skipping, transition in progress");
        return;
      }

      const nextIndex = chooseDifferentIndex(activeIndexRef.current, items.length);
      console.log("[gallery-bg] rotating", {
        from: activeIndexRef.current,
        to: nextIndex,
      });
      incomingIndexRef.current = nextIndex;
      setIncomingIndex(nextIndex);
    }, Math.max(intervalMs, 1_000));

    return () => {
      console.log("[gallery-bg] effect cleanup");
      window.clearInterval(interval);
    };
  }, [intervalMs, items.length, prefersReducedMotion]);

  const handleIncomingLoad = useCallback((index: number) => {
    if (incomingIndexRef.current !== index) {
      return;
    }

    if (reducedMotionRef.current) {
      finishTransition();
      return;
    }

    setIsFading(true);

    // Clear the loading timeout since image loaded successfully
    if (incomingLoadTimeoutRef.current) {
      clearTimeout(incomingLoadTimeoutRef.current);
      incomingLoadTimeoutRef.current = null;
    }
  }, [finishTransition]);

  const handleIncomingError = useCallback((index: number) => {
    if (incomingIndexRef.current !== index) {
      return;
    }

    // Clear the loading timeout on error
    if (incomingLoadTimeoutRef.current) {
      clearTimeout(incomingLoadTimeoutRef.current);
      incomingLoadTimeoutRef.current = null;
    }

    incomingIndexRef.current = null;
    setIncomingIndex(null);
    setIsFading(false);
  }, []);

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

  // Setup loading timeout when incoming index changes
  useEffect(() => {
    if (incomingIndex !== null) {
      // Set a timeout to force transition start after 1 second if image doesn't load
      // This prevents getting stuck if onLoad never fires
      incomingLoadTimeoutRef.current = setTimeout(() => {
        if (incomingIndexRef.current === incomingIndex && !reducedMotionRef.current) {
          console.log("[gallery-bg] image load timeout, forcing transition start");
          setIsFading(true);
        }
      }, 1000);

      return () => {
        if (incomingLoadTimeoutRef.current) {
          clearTimeout(incomingLoadTimeoutRef.current);
          incomingLoadTimeoutRef.current = null;
        }
      };
    }
  }, [incomingIndex]);

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
