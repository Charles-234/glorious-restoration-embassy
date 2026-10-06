import * as React from "react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/siteData";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ title, subtitle, className }: SectionHeadingProps) {
  return (
    <div className={cn("space-y-3 text-center", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent sm:text-sm sm:tracking-[0.24em]">{siteConfig.brandName}</p>
      <h2 className="font-display text-3xl font-normal leading-tight tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{subtitle}</p> : null}
    </div>
  );
}
