"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { heroContent, fallbackHeroImages } from "@/lib/siteData";
import { PlayCircle, ArrowRight } from "lucide-react";

export interface HeroProps {
  images?: string[];
}

export function Hero({ images = fallbackHeroImages }: HeroProps) {
  const heroImages = images;
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length === 0) return;

    const interval = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % heroImages.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 text-white sm:pb-20">
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <motion.div
            key={image}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === imageIndex ? 1 : 0 }}
            transition={{ duration: 1.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={image}
              alt="Worship moment at Glorious Restoration Embassy"
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>
        ))}
      </div>
      <div className="media-scrim absolute inset-0" />
      <div className="container relative">
        <div className="flex min-h-[72vh] flex-col justify-center gap-8 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, ease: "easeOut" }} 
            className="max-w-4xl space-y-6 text-legible text-overlay"
          >
            {/* Premium eyebrow label */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              <span className="inline-flex rounded-full border border-brand-sky/35 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-sky backdrop-blur-xl sm:tracking-[0.32em]">
                Year of Great Harvest
              </span>
            </motion.div>

            {/* Premium heading with variable sizing */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.3 }}
              className="font-display text-4xl font-semibold leading-[1.05] tracking-normal text-white sm:text-6xl lg:text-7xl"
            >
              {heroContent.title}
            </motion.h1>

            {/* Optional secondary tagline with refined typography */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="max-w-2xl text-base font-medium leading-relaxed text-slate-100 sm:text-xl"
            >
              Experience worship, community, and spiritual growth in Kenya
            </motion.p>
          </motion.div>

          {/* Premium CTA buttons with magnetic hover effects */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1.1, delay: 0.5 }} 
            className="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Link 
              href="/livestream" 
              className="group relative inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-brand-feather via-brand-royal to-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-[0_25px_80px_-40px_rgba(99,179,237,0.9)] transition duration-500 hover:scale-105 hover:shadow-[0_35px_120px_-30px_rgba(99,179,237,1.2)]"
            >
              <span className="flex items-center gap-2">
                {heroContent.ctaPrimary}
                <PlayCircle size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link 
              href="/ministries" 
              className="group inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-xl transition duration-500 hover:border-brand-sky/60 hover:bg-brand-sky/15"
            >
              {heroContent.ctaSecondary}
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
