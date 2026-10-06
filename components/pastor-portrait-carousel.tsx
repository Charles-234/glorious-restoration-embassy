"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import styles from "./pastor-portrait-carousel.module.css";

export interface PastorPortraitSlide {
  /** Public URL for the image, for example "/stitch/pastor-1.jpg". */
  src: string;
  /** Accurate description of the portrait for people who cannot see it. */
  alt: string;
  /** The verified caption associated with this portrait. */
  caption: string;
}

export interface PastorPortraitCarouselProps {
  slides: PastorPortraitSlide[];
  /** Accessible name for the carousel region. */
  ariaLabel?: string;
  /** Automatic rotation interval in milliseconds. */
  intervalMs?: number;
  className?: string;
}

const DEFAULT_INTERVAL_MS = 6000;

export default function PastorPortraitCarousel({
  slides,
  ariaLabel = "Pastor portraits",
  intervalMs = DEFAULT_INTERVAL_MS,
  className,
}: PastorPortraitCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const rotationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideCount = slides.length;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotionPreference = () => {
      setReducedMotion(preference.matches);
      setIsPlaying(!preference.matches && slideCount > 1);
    };

    syncMotionPreference();
    preference.addEventListener("change", syncMotionPreference);

    return () => preference.removeEventListener("change", syncMotionPreference);
  }, [slideCount]);

  const stopRotation = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const showSlide = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setActiveIndex((index + slideCount) % slideCount);
      stopRotation();
    },
    [slideCount, stopRotation],
  );

  const showPrevious = useCallback(
    () => showSlide(activeIndex - 1),
    [activeIndex, showSlide],
  );

  const showNext = useCallback(
    () => showSlide(activeIndex + 1),
    [activeIndex, showSlide],
  );

  useEffect(() => {
    if (!isPlaying || reducedMotion || slideCount < 2) return;

    rotationTimer.current = setInterval(() => {
      setActiveIndex((index) => (index + 1) % slideCount);
    }, Math.max(1000, intervalMs));

    return () => {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      rotationTimer.current = null;
    };
  }, [intervalMs, isPlaying, reducedMotion, slideCount]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    } else if (event.key === "Home") {
      event.preventDefault();
      showSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      showSlide(slideCount - 1);
    }
  };

  if (slideCount === 0) {
    return (
      <section
        className={[styles.carousel, className].filter(Boolean).join(" ")}
        aria-label={ariaLabel}
      >
        <p className={styles.empty}>Portraits are not available.</p>
      </section>
    );
  }

  const activeSlide = slides[activeIndex] ?? slides[0];

  return (
    <section
      className={[styles.carousel, className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      onFocusCapture={stopRotation}
      onMouseEnter={stopRotation}
    >
      <div className={styles.frame}>
        <Image
          className={styles.image}
          src={activeSlide.src}
          alt={activeSlide.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 960px"
          priority={activeIndex === 0}
        />
      </div>

      <div className={styles.captionArea} aria-live={isPlaying ? "off" : "polite"}>
        <p className={styles.caption} key={`${activeIndex}-${activeSlide.caption}`}>
          {activeSlide.caption}
        </p>
        <p className={styles.count} aria-label={`Slide ${activeIndex + 1} of ${slideCount}`}>
          {activeIndex + 1} <span aria-hidden="true">/</span> {slideCount}
        </p>
      </div>

      {slideCount > 1 && (
        <div className={styles.controls} role="group" aria-label="Carousel controls">
          <button
            className={styles.controlButton}
            type="button"
            onClick={showPrevious}
            aria-label="Previous portrait"
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          <div className={styles.dots} role="group" aria-label="Choose a portrait">
            {slides.map((slide, index) => (
              <button
                className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
                key={`${slide.src}-${index}`}
                type="button"
                onClick={() => showSlide(index)}
                aria-label={`Show portrait ${index + 1}: ${slide.caption}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>

          <button
            className={styles.controlButton}
            type="button"
            onClick={showNext}
            aria-label="Next portrait"
          >
            <ChevronRight aria-hidden="true" />
          </button>

          <button
            className={styles.controlButton}
            type="button"
            onClick={() => setIsPlaying((playing) => !playing)}
            disabled={reducedMotion}
            aria-label={
              reducedMotion
                ? "Automatic slide show unavailable because reduced motion is enabled"
                : isPlaying
                  ? "Pause automatic slide show"
                  : "Start automatic slide show"
            }
            title={
              reducedMotion
                ? "Automatic playback is disabled by your motion preference"
                : undefined
            }
          >
            {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
        </div>
      )}
    </section>
  );
}
