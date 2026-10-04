"use client";

import { motion } from "framer-motion";
import { BookOpenText } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SermonCardProps {
  title: string;
  speaker: string;
  date: string;
  summary: string;
}

export function SermonCard({ title, speaker, date, summary }: SermonCardProps) {
  return (
    <motion.article whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 160 }} className="group">
      <Card className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-accent">Sermon</p>
            <h3 className="mt-3 text-xl font-semibold text-foreground">{title}</h3>
          </div>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <BookOpenText size={24} />
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
          <span>{speaker}</span>
          <span>{date}</span>
        </div>
        <div className="rounded-2xl border border-accent/25 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent">
          Sermon notes and AI summary placeholder
        </div>
      </Card>
    </motion.article>
  );
}
