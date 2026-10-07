"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EventCardProps {
  title: string;
  date: string;
  venue: string;
  description: string;
  badge: string;
  image?: string;
}

export function EventCard({ title, date, venue, description, badge, image }: EventCardProps) {
  return (
    <motion.article whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 150 }} className="group">
      <Card className="space-y-5">
        {image ? (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-accent">{badge}</p>
            <h3 className="mt-3 text-2xl font-semibold text-foreground">{title}</h3>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <CalendarDays size={20} />
          </div>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{date}</span>
          <span>{venue}</span>
        </div>
      </Card>
    </motion.article>
  );
}
