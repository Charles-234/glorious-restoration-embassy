"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { branches, siteConfig } from "@/lib/siteData";

export default function AboutPage() {
  return (
    <main className="container space-y-14 py-16 sm:py-20 lg:py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="About our mission"
          subtitle="Visit our headquarters in Joska, Machakos County."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          {siteConfig.brandName} is a spiritual home crafted for people seeking hope, artistic
          expression, and embodied faith. We gather in worship, prayer, and discipleship to restore
          dignity, awaken vision, and build healthy families.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        {[
          {
            title: "Heart of worship",
            body: "We gather in worship to encounter God, grow in disciple-making, and celebrate restoration across generations."
          },
          {
            title: "Creative culture",
            body: "We believe in art, music, and storytelling that reflect our identity, heritage, and a hopeful future."
          }
        ].map((item) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
          >
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">{item.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{item.body}</p>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="space-y-6">
        <SectionHeading
          title="Our locations"
          subtitle="Visit us for worship, fellowship, and discipleship."
          headingLevel="h2"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {branches.map((branch) => (
            <motion.div
              key={branch.city}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <Card className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{branch.city}</h2>
                    <p className="mt-1 text-sm uppercase tracking-[0.24em] text-accent">
                      {branch.kind}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">{branch.address}</p>
                {branch.coordinates && (
                  <p className="text-sm font-medium text-foreground">{branch.coordinates}</p>
                )}
                {branch.mapsUrl && (
                  <a
                    href={branch.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[2.75rem] items-center justify-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    View on Google Maps
                  </a>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}