/**
 * lib/content.ts
 *
 * This file reads content from the JSON/Markdown files that Decap CMS writes
 * into the content/ folder. If a file doesn't exist yet (before CMS is set up),
 * it falls back to the static data in siteData.ts so nothing breaks.
 *
 * HOW IT WORKS:
 * - Decap CMS saves content to content/sermons/, content/events/, etc.
 * - This file reads those files at build time
 * - Netlify rebuilds the site automatically after each CMS save
 * - Result: editing in the CMS → site updates within ~2 minutes
 */

import fs from "fs";
import path from "path";
import {
  sermons as fallbackSermons,
  events as fallbackEvents,
  galleryItems as fallbackGallery,
  pastor as fallbackPastor,
  heroContent as fallbackHero,
  donationInfo as fallbackDonation,
} from "./siteData";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Sermon = {
  title: string;
  speaker: string;
  date: string;
  summary: string;
  thumbnail?: string;
};

export type Event = {
  title: string;
  date: string;
  venue: string;
  description: string;
  badge: string;
  image?: string;
};

export type GalleryItem = {
  title: string;
  image: string;
  date?: string;
};

export type Announcement = {
  title: string;
  body: string;
  date: string;
  active: boolean;
};

export type HeroContent = {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type PastorProfile = {
  name: string;
  bio: string;
  image: string;
  title?: string;
  email?: string;
};

// ─── Helper: read all JSON files from a content folder ───────────────────────

function readContentFolder<T>(folderName: string): T[] {
  try {
    const folderPath = path.join(process.cwd(), "content", folderName);
    if (!fs.existsSync(folderPath)) return [];

    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".json"));
    return files.map((file) => {
      const raw = fs.readFileSync(path.join(folderPath, file), "utf-8");
      return JSON.parse(raw) as T;
    });
  } catch {
    return [];
  }
}

// ─── Helper: read a single JSON settings file ────────────────────────────────

function readSettingsFile<T>(filename: string): T | null {
  try {
    const filePath = path.join(process.cwd(), "content", "settings", filename);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ─── Exported functions ───────────────────────────────────────────────────────

/** Returns sermons from CMS, or falls back to siteData.ts */
export function getSermons(): Sermon[] {
  const fromCMS = readContentFolder<Sermon>("sermons");
  if (fromCMS.length > 0) {
    // Sort newest first
    return fromCMS.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  return fallbackSermons;
}

/** Returns events from CMS, or falls back to siteData.ts */
export function getEvents(): Event[] {
  const fromCMS = readContentFolder<Event>("events");
  if (fromCMS.length > 0) {
    return fromCMS.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
  return fallbackEvents;
}

/** Returns gallery photos from CMS, or falls back to siteData.ts */
export function getGalleryItems(): GalleryItem[] {
  const fromCMS = readContentFolder<GalleryItem>("gallery");
  if (fromCMS.length > 0) return fromCMS;
  return fallbackGallery;
}

/** Returns active announcements from CMS (newest first) */
export function getAnnouncements(): Announcement[] {
  const all = readContentFolder<Announcement>("announcements");
  return all
    .filter((a) => a.active !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Returns hero text from CMS, or falls back to siteData.ts */
export function getHeroContent(): HeroContent {
  return readSettingsFile<HeroContent>("hero.json") ?? fallbackHero;
}

/** Returns pastor profile from CMS, or falls back to siteData.ts */
export function getPastor(): PastorProfile {
  return readSettingsFile<PastorProfile>("pastor.json") ?? fallbackPastor;
}

/** Returns donation info from CMS, or falls back to siteData.ts */
export type DonationInfo = typeof fallbackDonation;

export function getDonationInfo(): DonationInfo {
  return readSettingsFile<DonationInfo>("donation.json") ?? fallbackDonation;
}
