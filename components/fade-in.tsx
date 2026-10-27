"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export function FadeIn({
  children,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={[className, "motion-reduce-visible"].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.section>
  );
}
