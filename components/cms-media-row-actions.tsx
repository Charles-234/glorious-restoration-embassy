"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, EyeOff, Eye, Trash2 } from "lucide-react";

type Props = {
  title: string;
  published: boolean;
  onEdit: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
};

export function CmsMediaRowActions({
  title,
  published,
  onEdit,
  onTogglePublished,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="absolute right-3 top-3 z-20">
      <button
        type="button"
        aria-label={`Actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        className="grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onTogglePublished();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
          >
            {published ? <EyeOff size={14} /> : <Eye size={14} />}
            {published ? "Hide from website" : "Show on website"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
