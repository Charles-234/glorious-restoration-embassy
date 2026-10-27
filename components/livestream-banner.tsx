"use client";

import { motion } from "framer-motion";
import Link from "next/link.js";
import { Button } from "@/components/ui/button";
import { Clock, Facebook, MessageSquare } from "lucide-react";
import { track, CHURCH_EVENTS } from "@/lib/analytics";

const sundaySchedule = [
  { time: "8.00 AM - 10.00 AM", label: "Prayers and Bible study" },
  { time: "10.00 AM - 11.30 AM", label: "Worship and Praise" },
  { time: "11.30 AM - 1.00 PM", label: "Main Service" }
];

export function LivestreamBanner() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="readable-surface relative overflow-hidden rounded-[2.5rem] p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,107,54,0.12),transparent),radial-gradient(circle_at_bottom_right,rgba(10,24,0,0.08),transparent)]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent sm:tracking-[0.32em]">Live Stream</p>
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Experience worship on every screen.</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Join our Facebook service, connect with the church family, and tune in for prophetic teaching and prayer.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="https://www.facebook.com/share/1Xob4wuJwK/"
              className="btn btn-secondary gap-2 text-sm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(CHURCH_EVENTS.LIVESTREAM_JOIN, { channel: "facebook" })}
            >
              <Facebook size={16} /> Facebook Live
            </Link>
            <Link href="/chat" className="btn btn-primary gap-2 text-sm">
              <MessageSquare size={16} /> Ask the assistant
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-warm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent sm:tracking-[0.32em]">Next service</p>
          <div className="mt-5 space-y-3">
            {sundaySchedule.map((item) => (
              <div key={item.time} className="rounded-2xl border border-border bg-muted p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock size={16} className="text-brand-gold" />
                  {item.time}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <Button className="mt-6 w-full">Set a reminder</Button>
        </div>
      </div>
    </motion.section>
  );
}
