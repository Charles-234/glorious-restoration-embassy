"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { galleryItems } from "@/lib/siteData";
import { Card } from "@/components/ui/card";

export function GalleryGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {galleryItems.map((item, index) => (
        <motion.div whileHover={{ y: -8 }} key={`${item.image}-${index}`} className="group">
          <Card className="overflow-hidden p-0">
            <div className="relative h-56 transition-transform duration-500 group-hover:scale-105">
              <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
            </div>
            <div className="bg-surface p-5">
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
