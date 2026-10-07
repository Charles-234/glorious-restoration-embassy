export const faithNewsCategories = ["Faith", "Politics", "Kenya", "Africa", "Exploration"] as const;

export type FaithNewsCategory = (typeof faithNewsCategories)[number];

export interface FaithNewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceAttributionUrl?: string;
  author: string | null;
  publishedAt: string | null;
  summary: string;
  imageUrl: string | null;
  categories: FaithNewsCategory[];
}

export interface DailyScripture {
  reference: string;
  text: string;
  translation: "World English Bible (WEB)";
  dateLabel: string;
  licenseUrl: string;
}

export interface FaithDashboardData {
  articles: FaithNewsArticle[];
  scripture: DailyScripture | null;
  errors: string[];
}
