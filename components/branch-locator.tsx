"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { branches } from "@/lib/siteData";

export function BranchLocator() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {branches.map((branch) => (
        <motion.article
          whileHover={{ y: -6 }}
          key={branch.city}
          className="readable-surface group rounded-[2rem] p-7 transition"
        >
          <div className="flex items-center gap-3 text-accent">
            <MapPin size={22} />
            <h3 className="text-xl font-semibold text-foreground">{branch.city}</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{branch.address}</p>
          <p className="mt-3 text-sm text-muted-foreground">{branch.phone}</p>
        </motion.article>
      ))}
    </div>
  );
}
