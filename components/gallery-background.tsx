"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { galleryItems } from "@/lib/siteData";
import styles from "./gallery-background.module.css";

interface GalleryBackgroundProps {
  className?: string;
  intervalMs?: number;
}

function chooseDifferentIndex(currentIndex: number): number {
  if (galleryItems.length < 2) {
    return currentIndex;
  }

  const randomIndex = Math.floor(Math.random() * (galleryItems.length - 1));
  return randomIndex >= currentIndex ? randomIndex + 1 : randomIndex;
}

export function GalleryBackground({
  className,
  intervalMs = 8_000,
}: GalleryBackgroundProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [startedManually, setStartedManually] = useState(false);
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
    const shouldRotate =
      isPlaying && (!prefersReducedMotion || startedManually);
    if (!shouldRotate || galleryItems.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      if (incomingIndexRef.current !== null) {
        return;
      }

      const nextIndex = chooseDifferentIndex(activeIndexRef.current);
      incomingIndexRef.current = nextIndex;
      setIncomingIndex(nextIndex);
    }, Math.max(intervalMs, 1_000));

    return () => window.clearInterval(interval);
  }, [intervalMs, isPlaying, prefersReducedMotion, startedManually]);

  const showSlide = (index: number) => {
    if (index === incomingIndexRef.current) {
      return;
    }

    if (index === activeIndexRef.current) {
      incomingIndexRef.current = null;
      setIncomingIndex(null);
      setIsFading(false);
      return;
    }

    incomingIndexRef.current = index;
    setIncomingIndex(index);
    setIsFading(false);
  };

  const showPrevious = () => {
    const currentIndex = incomingIndexRef.current ?? activeIndexRef.current;
    showSlide((currentIndex - 1 + galleryItems.length) % galleryItems.length);
  };

  const showNext = () => {
    const currentIndex = incomingIndexRef.current ?? activeIndexRef.current;
    showSlide((currentIndex + 1) % galleryItems.length);
  };

  const togglePlayback = () => {
    if (!isPlaying || (prefersReducedMotion && !startedManually)) {
      setStartedManually(true);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(false);
  };

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

  const currentItem = galleryItems[activeIndex];
  const activeSlideNumber = String(activeIndex + 1).padStart(2, "0");
  const totalSlides = String(galleryItems.length).padStart(2, "0");
  const isAutoPlaying = isPlaying && (!prefersReducedMotion || startedManually);

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
            src={currentItem.image}
            alt=""
            fill
            sizes="100vw"
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
              src={galleryItems[incomingIndex].image}
              alt=""
              fill
              sizes="100vw"
              loading="lazy"
              className={styles.image}
              onLoad={() => handleIncomingLoad(incomingIndex)}
              onError={() => handleIncomingError(incomingIndex)}
            />
          </div>
        )}
      </div>

      <div
        className={styles.controls}
        role="group"
        aria-label="Background slideshow controls"
      >
        <p className={styles.caption} aria-live="polite" aria-atomic="true">
          <span className={styles.captionTitle}>{currentItem.title}</span>
          <span className={styles.counter}>
            {activeSlideNumber} / {totalSlides}
          </span>
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={showPrevious}
            aria-label="Previous background image"
            title="Previous image"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={togglePlayback}
            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
            aria-pressed={isAutoPlaying}
            title={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isAutoPlaying ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={showNext}
            aria-label="Next background image"
            title="Next image"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className={styles.dots} role="group" aria-label="Choose an image">
          {galleryItems.map((item, index) => (
            <button
              key={item.image}
              type="button"
              className={[
                styles.dot,
                index === activeIndex ? styles.dotActive : "",
              ].join(" ")}
              onClick={() => showSlide(index)}
              aria-label={`Show image ${index + 1}: ${item.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              title={item.title}
            />
          ))}
        </div>
      </div>
    </>
  );
}
