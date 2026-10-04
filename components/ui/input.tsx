import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        // text-base (16px) stops iOS Safari zooming the page when the field is focused
        "w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition",
        "focus:border-primary focus:ring-2 focus:ring-primary/25",
        className
      )}
      {...props}
    />
  );
}
