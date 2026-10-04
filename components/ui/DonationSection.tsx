"use client";

import { motion } from "framer-motion";
import { donationInfo } from "@/lib/siteData";
import { Heart } from "lucide-react";
import Link from "next/link";

export function DonationSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-brand-deep text-white">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-royal via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-brand-gold via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-16 h-16 mx-auto bg-brand-gold/20 rounded-full flex items-center justify-center text-brand-gold mb-6"
          >
            <Heart size={32} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold"
          >
            {donationInfo.title}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80 leading-relaxed"
          >
            {donationInfo.description}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="pt-6"
          >
            <Link
              href="/give"
              className="inline-block bg-brand-gold hover:bg-brand-accent text-brand-deep px-10 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:-translate-y-1"
            >
              {donationInfo.cta}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
