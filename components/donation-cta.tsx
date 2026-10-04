"use client";

import { motion } from "framer-motion";

export function DonationCTA() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="readable-surface rounded-[2.5rem] p-10">
      <div className="space-y-5 text-center">
        <p className="text-sm uppercase tracking-[0.32em] text-accent">Giving update</p>
        <h2 className="text-3xl font-semibold text-foreground">Secure giving is being updated.</h2>
        <p className="max-w-2xl mx-auto leading-7 text-muted-foreground">We are refreshing our giving options. Please check back later for updated donation details and secure payment support.</p>
      </div>
    </motion.section>
  );
}
