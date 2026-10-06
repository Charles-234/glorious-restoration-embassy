"use client";

import { motion } from "framer-motion";
import { BookOpenText, Play } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SermonCardProps {
  title: string;
  speaker: string;
  date: string;
  summary: string;
  videoUrl?: string;
  thumbnail?: string;
}

type SermonMedia =
  | { kind: "file"; src: string }
  | { kind: "embed"; src: string }
  | { kind: "link"; href: string };

function resolveSermonMedia(videoUrl?: string): SermonMedia | null {
  if (!videoUrl) return null;

  if (videoUrl.startsWith("/") && /\.mp4(?:$|[?#])/i.test(videoUrl)) {
    return { kind: "file", src: videoUrl };
  }

  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();

  if (/\.mp4$/i.test(url.pathname)) {
    return { kind: "file", src: url.toString() };
  }

  if (host === "youtu.be" || host.endsWith(".youtube.com") || host === "youtube.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const videoId =
      (host === "youtu.be" ? segments[0] : url.searchParams.get("v")) ??
      (["embed", "shorts", "live"].includes(segments[0]) ? segments[1] : undefined);

    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${videoId}` };
  }

  if (
    host === "facebook.com" ||
    host.endsWith(".facebook.com")
  ) {
    return {
      kind: "embed",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false`,
    };
  }

  return { kind: "link", href: url.toString() };
}

export function SermonCard({
  title,
  speaker,
  date,
  summary,
  videoUrl,
  thumbnail,
}: SermonCardProps) {
  const media = resolveSermonMedia(videoUrl);

  return (
    <motion.article whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 160 }} className="group">
      <Card className="space-y-5">
        {media ? (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
            {media.kind === "file" ? (
              <video
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                poster={thumbnail}
                aria-label={`Sermon video: ${title}`}
              >
                <source src={media.src} type="video/mp4" />
                Your browser does not support HTML video.
              </video>
            ) : media.kind === "embed" ? (
              <iframe
                className="h-full w-full"
                src={media.src}
                title={`Sermon video: ${title}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <a
                className="flex h-full items-center justify-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                href={media.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Play size={18} aria-hidden="true" />
                Watch sermon
              </a>
            )}
          </div>
        ) : null}
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
      </Card>
    </motion.article>
  );
}
