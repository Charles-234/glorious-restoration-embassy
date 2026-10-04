"use client";

import { motion } from "framer-motion";
import { events } from "@/lib/siteData";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";

export function EventsSection() {
  const featuredEvent = events[0];

  if (!featuredEvent) return null;

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm uppercase tracking-widest text-brand-royal font-bold mb-3">Featured Event</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-foreground">Join Us in Celebration</h3>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-8 md:p-12 border-brand-sky dark:border-brand-deep relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-brand-sky/30 dark:bg-brand-royal/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="bg-brand-royal text-white p-6 rounded-2xl flex flex-col items-center justify-center min-w-[140px] shadow-xl">
                <span className="text-sm font-semibold uppercase mb-1">August</span>
                <span className="text-5xl font-display font-bold leading-none mb-1">15</span>
                <span className="text-sm">2026</span>
              </div>
              
              <div className="flex-1 space-y-4">
                <h4 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {featuredEvent.title}
                </h4>
                <p className="text-muted-foreground text-lg">
                  {featuredEvent.description}
                </p>
                <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 pt-4">
                  <div className="flex items-center text-sm font-medium text-foreground/80">
                    <MapPin className="w-4 h-4 mr-2 text-brand-royal" />
                    {featuredEvent.venue}
                  </div>
                  <div className="flex items-center text-sm font-medium text-foreground/80">
                    <Calendar className="w-4 h-4 mr-2 text-brand-royal" />
                    Save the Date
                  </div>
                </div>
              </div>

              <div className="pt-4 md:pt-0">
                <Link
                  href="/events"
                  className="inline-block bg-foreground text-background hover:bg-brand-royal hover:text-white px-8 py-3 rounded-full font-semibold transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
