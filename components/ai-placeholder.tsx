import { Sparkles } from "lucide-react";

export function AIPlaceholder({ label }: { label: string }) {
  return (
    <div className="readable-surface rounded-[2rem] p-6">
      <div className="flex items-center gap-3 text-accent">
        <Sparkles size={20} />
        <p className="text-sm uppercase tracking-[0.32em] text-accent">AI placeholder</p>
      </div>
      <p className="mt-4 text-xl font-semibold text-foreground">{label}</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">This section is ready for future AI-powered sermon summaries and chat experiences.</p>
    </div>
  );
}
