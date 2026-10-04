"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { heroContent } from "@/lib/siteData";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: 'url("/hero-poster.jpg")' }}
      >
        <div className="absolute inset-0 bg-brand-deep/60 dark:bg-brand-deep/80" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white drop-shadow-lg">
            {heroContent.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            {heroContent.subtitle}
          </p>

          <div className="glass-card inline-block p-6 rounded-2xl max-w-2xl mx-auto my-8 border-white/20 bg-black/20 text-left">
            <h3 className="text-brand-gold font-display text-xl mb-2 italic">Isaiah 43:19</h3>
            <p className="text-white/90 text-lg leading-relaxed">
              &quot;See, I am doing a new thing! Now it springs up; do you not perceive it? I am making a way in the wilderness and streams in the wasteland.&quot;
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/about"
              className="w-full sm:w-auto bg-brand-royal hover:bg-brand-ocean text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-brand-royal/25"
            >
              {heroContent.ctaPrimary}
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-8 h-12 rounded-full border-2 border-white/30 flex justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-1.5 h-3 bg-brand-gold rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
