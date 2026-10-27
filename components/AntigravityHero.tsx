'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image.js';
import Link from 'next/link.js';
import { motion } from 'framer-motion';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { fallbackHeroImages } from "@/lib/siteData";

gsap.registerPlugin(ScrollTrigger);

export interface AntigravityHeroProps {
  images?: string[];
}

export default function AntigravityHero({ images = fallbackHeroImages }: AntigravityHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Main title animation
      tl.fromTo(
        titleRef.current,
        { y: 100, opacity: 0, rotateX: -45 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.2, ease: 'power3.out' }
      )
        // Subtitle animation
        .fromTo(
          subtitleRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
          '-=0.8'
        )
        // Images animation with 3D effect
        .fromTo(
          imagesRef.current,
          { y: 150, opacity: 0, rotateY: 30, rotateX: 20, translateZ: -200 },
          {
            y: 0,
            opacity: 1,
            rotateY: (index) => (index - 1) * 15,
            rotateX: 10,
            translateZ: 0,
            stagger: 0.2,
            duration: 1.5,
            ease: 'expo.out',
          },
          '-=0.8'
        );

      // Floating animation for each image
      imagesRef.current.forEach((el, index) => {
        gsap.to(el, {
          y: '+=20',
          rotateX: '+=5',
          rotateY: '-=5',
          duration: 3 + index,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });

        // Scroll-based parallax
        gsap.to(el, {
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
          y: (index + 1) * -50,
          rotateX: 25,
          scale: 0.9,
          opacity: 0.7,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !imagesRef.current.includes(el)) {
      imagesRef.current.push(el);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative isolate flex min-h-[90svh] flex-col justify-center overflow-hidden bg-background bg-hero-glow perspective-container"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="absolute -right-32 bottom-16 h-96 w-96 rounded-full bg-brand-olive/10 blur-3xl" />
      </div>

      <div className="absolute inset-0 z-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-64 w-64 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-olive/10 opacity-30 blur-3xl"
            style={{
              top: `${20 + i * 30}%`,
              left: `${10 + i * 25}%`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-24 pt-28 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-32">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-4"
          >
            <span className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Year of Great Harvest
            </span>
          </motion.div>

          <h1
            ref={titleRef}
            className="preserve-3d font-display text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl xl:text-6xl"
          >
            A place to belong.
            <br />
            <span className="text-accent">A place to be restored.</span>
          </h1>

          <motion.p
            ref={subtitleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg lg:mx-0"
          >
            A place of weightless faith, boundless grace, and immersive spiritual depth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link href="/livestream" className="btn btn-primary group min-w-44">
              <span className="flex items-center gap-2">
                Watch Live
                <PlayCircle size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link href="/ministries" className="btn btn-secondary group min-w-44">
              Our Ministries
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <Link
            href="/sermons"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-foreground transition-colors hover:text-accent"
          >
            Explore recent sermons <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="z-20 grid w-full grid-cols-2 items-center gap-4 preserve-3d sm:gap-5">
          {images.map((src, i) => {
            const imageConfigs = [
              { alt: 'Worship Moment 1' },
              { alt: 'Church Community' },
              { alt: 'Worship Moment 2' },
            ];
            const img = { src, alt: imageConfigs[i]?.alt || `Worship moment ${i + 1}` };
            return (
              <motion.div
                key={img.src}
                ref={addToRefs}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.2, duration: 0.8 }}
                className={`glass relative aspect-[4/5] w-full rounded-2xl p-2 shadow-warm preserve-3d ${i === 1 ? "col-span-2 aspect-[16/10] sm:col-span-1 sm:aspect-[4/5]" : ""}`}
                style={{ transformOrigin: 'center center' }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-contain"
                    priority={i === 1}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="absolute -bottom-10 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-brand-deep/10 blur-xl" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-3 left-1/2 z-30 hidden -translate-x-1/2 text-foreground/50 lg:block"
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
        </div>
      </motion.div>
    </div>
  );
}
