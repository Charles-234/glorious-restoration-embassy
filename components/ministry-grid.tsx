"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ministries } from "@/lib/siteData";
import { Music, Sparkles, HeartPulse, BookOpen, HeartHandshake, Mountain } from "lucide-react";

const icons = {
  Music,
  Sparkles,
  HeartPulse,
  BookOpen,
  HeartHandshake,
  Mountain
};

export function MinistryGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.32, 0.72, 0, 1]
      }
    }
  };

  return (
    <motion.div 
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {ministries.map((item) => {
        const Icon = icons[item.icon as keyof typeof icons];
        return (
          <motion.div 
            key={item.title} 
            variants={itemVariants}
            className="group"
          >
            {/* Outer bezel shell */}
            <div className="rounded-[2rem] p-1.5 bg-gradient-to-br from-brand-sky/10 via-transparent to-brand-blue/10 transition-all duration-500 group-hover:from-brand-sky/20 group-hover:to-brand-blue/20">
              {/* Inner card content */}
              <Card className="space-y-5 relative overflow-hidden">
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-brand-sky/5 to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />

                {/* Content layer */}
                <div className="relative space-y-5">
                  {/* Premium icon container */}
                  <motion.div 
                    className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20"
                    whileHover={{ scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Icon size={22} className="transition-transform group-hover:scale-110" />
                  </motion.div>

                  {/* Text content */}
                  <div>
                    <motion.h3 
                      className="text-xl font-semibold text-foreground"
                      whileHover={{ letterSpacing: "0.02em" }}
                    >
                      {item.title}
                    </motion.h3>
                    <motion.p 
                      className="mt-3 text-sm leading-7 text-muted-foreground"
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                    >
                      {item.description}
                    </motion.p>
                  </div>

                  {/* Subtle CTA indicator */}
                  <motion.div 
                    className="h-px bg-gradient-to-r from-brand-sky/0 via-brand-sky/30 to-brand-sky/0 opacity-0 group-hover:opacity-100"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </Card>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
