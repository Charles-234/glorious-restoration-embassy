import {
  sermons as fallbackSermons,
  events as fallbackEvents,
  galleryItems as fallbackGallery,
  pastor as fallbackPastor,
  heroContent as fallbackHero,
  donationInfo as fallbackDonation,
} from "./siteData";
import { reportSiteContentReadError } from "@/lib/cms-diagnostics";
import { getPublicSupabaseClient } from "@/lib/public-supabase";

export type Sermon = {
  title: string;
  speaker: string;
  date: string;
  summary: string;
  thumbnail?: string;
  videoUrl?: string;
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

async function readPublishedContent<T>(kind: string): Promise<T[] | null> {
  try {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("payload")
      .eq("kind", kind)
      .eq("published", true);

    if (error) {
      reportSiteContentReadError(`${kind} content`, error);
      return null;
    }

    return data.map((row) => row.payload as T);
  } catch (error) {
    console.error(`[cms] Could not initialize the Supabase client for ${kind} content.`, error);
    return null;
  }
}

async function readPublishedSetting<T>(slug: string): Promise<T | null> {
  try {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("payload")
      .eq("kind", "setting")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      reportSiteContentReadError(`the ${slug} setting`, error);
      return null;
    }

    return data?.payload as T | null;
  } catch (error) {
    console.error(`[cms] Could not initialize the Supabase client for the ${slug} setting.`, error);
    return null;
  }
}

export async function getSermons(): Promise<Sermon[]> {
  const fromSupabase = await readPublishedContent<Sermon>("sermon");
  const sermons = fromSupabase ?? fallbackSermons;
  return sermons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getEvents(): Promise<Event[]> {
  const fromSupabase = await readPublishedContent<Event>("event");
  const events = fromSupabase ?? fallbackEvents;
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return (await readPublishedContent<GalleryItem>("gallery")) ?? fallbackGallery;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const announcements = (await readPublishedContent<Announcement>("announcement")) ?? [];
  return announcements
    .filter((item) => item.active !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getHeroContent(): Promise<HeroContent> {
  return (await readPublishedSetting<HeroContent>("hero")) ?? fallbackHero;
}

export async function getPastor(): Promise<PastorProfile> {
  return (await readPublishedSetting<PastorProfile>("pastor")) ?? fallbackPastor;
}

export type DonationInfo = typeof fallbackDonation;

export async function getDonationInfo(): Promise<DonationInfo> {
  return (await readPublishedSetting<DonationInfo>("donation")) ?? fallbackDonation;
}
