'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayCircle, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AntigravityHero() {
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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden perspective-container"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 z-0 bg-hero-glow opacity-60" />

      {/* Floating decorative elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-brand-gold/10 to-brand-royal/10 opacity-30 blur-3xl"
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

      {/* Main content */}
      <div className="z-10 text-center mt-20 mb-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-4"
        >
          <span className="inline-flex rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent backdrop-blur-sm">
            Year of Great Harvest
          </span>
        </motion.div>
        
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter preserve-3d text-foreground"
          style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
        >
          GLORIOUS RESTORATION <br />
          <span className="text-brand-accent">EMBASSY</span>
        </h1>
        
        <motion.p
          ref={subtitleRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-6 text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto leading-relaxed"
        >
          A place of weightless faith, boundless grace, and immersive spiritual depth.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center justify-center"
        >
          <Link 
            href="/livestream" 
            className="group relative inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-brand-royal via-brand-blue to-brand-ocean px-8 py-4 text-sm font-semibold text-white shadow-lg transition duration-500 hover:scale-105 hover:shadow-xl"
          >
            <span className="flex items-center gap-2">
              Watch Live
              <PlayCircle size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link 
            href="/ministries" 
            className="group inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-xl transition duration-500 hover:border-brand-accent/60 hover:bg-brand-accent/15"
          >
            Our Ministries
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Floating images with 3D effect */}
      <div className="z-20 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-6xl px-8 preserve-3d">
        {[
          { src: '/gallery/photo24.jpeg', alt: 'Worship Moment 1' },
          { src: '/gallery/photo30.jpeg', alt: 'Church Community' },
          { src: '/gallery/photo25.jpeg', alt: 'Worship Moment 2' },
        ].map((img, i) => (
          <motion.div
            key={i}
            ref={addToRefs}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.2, duration: 0.8 }}
            className="glass p-2 rounded-2xl preserve-3d w-full md:w-1/3 aspect-[4/5] relative transition-transform duration-500 hover:scale-105 shadow-glow"
            style={{ transformOrigin: 'center center' }}
            whileHover={{ scale: 1.05, zIndex: 50 }}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
                priority={i === 1}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-brand-royal/20 blur-xl rounded-full" />
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="flex flex-col items-center gap-2 text-white/60">
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
