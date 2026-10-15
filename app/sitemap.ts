import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteData";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const routes: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/pastor", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sermons", changeFrequency: "weekly", priority: 0.9 },
  { path: "/events", changeFrequency: "weekly", priority: 0.9 },
  { path: "/livestream", changeFrequency: "weekly", priority: 0.8 },
  { path: "/ministries", changeFrequency: "monthly", priority: 0.7 },
  { path: "/branches", changeFrequency: "monthly", priority: 0.7 },
  { path: "/gallery", changeFrequency: "monthly", priority: 0.6 },
  { path: "/news", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/library", changeFrequency: "monthly", priority: 0.6 },
  { path: "/chat", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.7 },
  { path: "/give", changeFrequency: "yearly", priority: 0.8 },
  { path: "/donate", changeFrequency: "yearly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
