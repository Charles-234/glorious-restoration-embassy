import { NextResponse } from "next/server";
import type {
  DailyScripture,
  FaithDashboardData,
  FaithNewsArticle,
  FaithNewsCategory,
} from "@/lib/faith-dashboard";

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const RSS2JSON_API_URL = "https://api.rss2json.com/v1/api.json";
const BIBLE_LICENSE_URL = "https://ebible.org/Scriptures/details.php?id=engwebp";
const dailyScriptures = [
  { book: "PSA", chapter: 23, verse: 1, reference: "Psalm 23:1" },
  { book: "ISA", chapter: 40, verse: 31, reference: "Isaiah 40:31" },
  { book: "MAT", chapter: 11, verse: 28, reference: "Matthew 11:28" },
  { book: "PHP", chapter: 4, verse: 13, reference: "Philippians 4:13" },
  { book: "PRO", chapter: 3, verse: 5, reference: "Proverbs 3:5" },
  { book: "ROM", chapter: 8, verse: 28, reference: "Romans 8:28" },
  { book: "JHN", chapter: 14, verse: 6, reference: "John 14:6" },
] as const;
const FEEDS = [
  {
    name: "Faithwire",
    url: "https://www.faithwire.com/feed/",
    publisherUrl: "https://faithwire.com",
    articleHosts: ["faithwire.com"],
    categories: ["Faith"] as FaithNewsCategory[],
  },
  {
    name: "Christian Newswire",
    url: "https://www.christiannewswire.com/feed/",
    publisherUrl: "https://christiannewswire.com",
    articleHosts: ["christiannewswire.com"],
    categories: ["Faith"] as FaithNewsCategory[],
  },
  {
    name: "Charisma News",
    url: "https://mycharisma.com/category/news/feed/",
    publisherUrl: "https://charismanews.com",
    articleHosts: ["mycharisma.com"],
    categories: ["Faith"] as FaithNewsCategory[],
  },
  {
    name: "Faith News Service",
    url: "https://faithnewsservice.com/feed/",
    publisherUrl: "https://faithnewsservice.com",
    articleHosts: ["faithnewsservice.com"],
    categories: ["Faith"] as FaithNewsCategory[],
  },
  {
    name: "Dove Foundation",
    url: "https://dove.org/feed/",
    publisherUrl: "https://dove.org",
    articleHosts: ["dove.org"],
    categories: ["Entertainment"] as FaithNewsCategory[],
  },
  {
    name: "The Gospel Coalition",
    url: "https://www.thegospelcoalition.org/feed/",
    publisherUrl: "https://www.thegospelcoalition.org",
    articleHosts: ["thegospelcoalition.org"],
    categories: ["Faith"] as FaithNewsCategory[],
  },
  {
    name: "Plugged In",
    url: "https://www.pluggedin.com/feed/",
    publisherUrl: "https://www.pluggedin.com",
    articleHosts: ["pluggedin.com"],
    categories: ["Entertainment"] as FaithNewsCategory[],
  },
  {
    name: "Christian Headlines",
    url: "https://www.christianheadlines.com/rss/feed.xml",
    publisherUrl: "https://www.christianheadlines.com",
    articleHosts: ["christianheadlines.com"],
    categories: ["Faith"] as FaithNewsCategory[],
  },
  {
    name: "Relevant Magazine",
    url: "https://relevantmagazine.com/feed/",
    publisherUrl: "https://relevantmagazine.com",
    articleHosts: ["relevantmagazine.com"],
    categories: ["Entertainment"] as FaithNewsCategory[],
  },
] as const;

type JsonRecord = Record<string, unknown>;
type SourceResult<T> =
  | { source: string; value: T; error: false }
  | { source: string; value: null; error: true };

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function plainTextSummary(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

function validPublisherArticleUrl(value: unknown, allowedHosts: readonly string[]): string | null {
  const articleUrl = validHttpsUrl(value);
  if (!articleUrl) return null;
  const articleHost = new URL(articleUrl).hostname.toLowerCase().replace(/^www\./, "");
  return allowedHosts.some((host) => {
    const publisherHost = host.toLowerCase().replace(/^www\./, "");
    return articleHost === publisherHost || articleHost.endsWith(`.${publisherHost}`);
  })
    ? articleUrl
    : null;
}

async function fetchJson(url: string, revalidateSeconds: number): Promise<unknown> {
  const response = await fetch(url, {
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`Upstream returned HTTP ${response.status}.`);
  }
  return response.json();
}

async function readSource<T>(
  source: string,
  load: () => Promise<T>,
): Promise<SourceResult<T>> {
  try {
    return { source, value: await load(), error: false };
  } catch (error) {
    console.error(`[news] ${source} request failed.`, error);
    return { source, value: null, error: true };
  }
}

function categoriesFor(
  text: string,
  sourceCategories: readonly FaithNewsCategory[] = [],
): FaithNewsCategory[] {
  const normalized = text.toLowerCase();
  const categories = new Set<FaithNewsCategory>(sourceCategories);

  if (/\b(church|christian|christianity|faith|bible|jesus|religious|religion|worship)\b/.test(normalized)) {
    categories.add("Faith");
  }
  if (/\b(politic|government|election|president|parliament|minister|campaign|policy)\w*/.test(normalized)) {
    categories.add("Politics");
  }
  if (/\bkenya|kenyan\b/.test(normalized)) categories.add("Kenya");
  if (/\bafrica|african\b/.test(normalized)) categories.add("Africa");

  return [...categories];
}

function parseNewsApi(data: unknown): FaithNewsArticle[] {
  if (!isRecord(data) || !Array.isArray(data.articles)) {
    throw new Error("News API returned an invalid response.");
  }

  const thumbnailsEnabled = process.env.NEWS_THUMBNAILS_LICENSE_CONFIRMED === "true";

  return data.articles.flatMap((article) => {
    if (!isRecord(article) || typeof article.title !== "string" || !article.title.trim()) return [];
    const url = validHttpsUrl(article.url);
    if (!url || article.title === "[Removed]") return [];

    const source = isRecord(article.source) && typeof article.source.name === "string"
      ? article.source.name
      : "NewsAPI";
    const description = typeof article.description === "string" ? article.description : "";
    const categories = categoriesFor(`${article.title} ${description}`);

    return [{
      id: url,
      title: plainTextSummary(article.title),
      url,
      source,
      author: typeof article.author === "string" && article.author.trim()
        ? article.author.trim()
        : null,
      publishedAt: typeof article.publishedAt === "string" && Number.isFinite(Date.parse(article.publishedAt))
        ? new Date(article.publishedAt).toISOString()
        : null,
      summary: plainTextSummary(article.description),
      imageUrl: thumbnailsEnabled ? validHttpsUrl(article.urlToImage) : null,
      categories,
    }];
  });
}

async function fetchFeed(
  feed: (typeof FEEDS)[number],
  thumbnailsEnabled: boolean,
): Promise<FaithNewsArticle[]> {
  const url = new URL(RSS2JSON_API_URL);
  url.searchParams.set("rss_url", feed.url);
  url.searchParams.set("count", "10");

  const data = await fetchJson(url.toString(), 3600);
  if (!isRecord(data) || data.status !== "ok" || !Array.isArray(data.items)) {
    throw new Error("RSS service returned an invalid feed response.");
  }

  return data.items.flatMap((item) => {
    if (!isRecord(item) || typeof item.title !== "string" || !item.title.trim()) return [];
    const articleUrl = validPublisherArticleUrl(item.link, feed.articleHosts);
    if (!articleUrl) return [];

    const publishedAt = typeof item.pubDate === "string" && Number.isFinite(Date.parse(item.pubDate))
      ? new Date(item.pubDate).toISOString()
      : null;

    const enclosure = isRecord(item.enclosure) ? item.enclosure : null;
    const imageCandidate = typeof item.thumbnail === "string"
      ? item.thumbnail
      : typeof item.image === "string"
        ? item.image
        : enclosure && typeof enclosure.link === "string"
          ? enclosure.link
          : null;
    const summary = plainTextSummary(item.description);

    return [{
      id: articleUrl,
      title: plainTextSummary(item.title),
      url: articleUrl,
      source: feed.name,
      ...("publisherUrl" in feed ? { sourceAttributionUrl: feed.publisherUrl } : {}),
      author: typeof item.author === "string" && item.author.trim() ? item.author.trim() : null,
      publishedAt,
      summary,
      imageUrl: thumbnailsEnabled ? validHttpsUrl(imageCandidate) : null,
      categories: categoriesFor(`${item.title} ${summary}`, feed.categories),
    }];
  });
}

function getDailyScriptureSelection(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(dateParts.find((item) => item.type === type)?.value);
  const year = part("year");
  const month = part("month");
  const day = part("day");
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  const index = ((dayNumber % dailyScriptures.length) + dailyScriptures.length) % dailyScriptures.length;

  return {
    ...dailyScriptures[index],
    dateLabel: new Intl.DateTimeFormat("en-KE", {
      dateStyle: "full",
      timeZone: "Africa/Nairobi",
    }).format(now),
    apiUrl: `https://bible.helloao.org/api/ENGWEBP/${dailyScriptures[index].book}/${dailyScriptures[index].chapter}.json`,
  };
}

async function fetchDailyScripture(): Promise<DailyScripture> {
  const selection = getDailyScriptureSelection();
  const data = await fetchJson(selection.apiUrl, 86400);
  if (!isRecord(data) || !isRecord(data.chapter) || !Array.isArray(data.chapter.content)) {
    throw new Error("Bible API returned an invalid chapter response.");
  }

  const verse = data.chapter.content.find(
    (item) => isRecord(item) && item.type === "verse" && item.number === selection.verse,
  );
  if (!isRecord(verse) || !Array.isArray(verse.content)) {
    throw new Error(`${selection.reference} was not present in the Bible API response.`);
  }

  const text = verse.content
    .map((part) => {
      if (typeof part === "string") return part;
      if (isRecord(part) && typeof part.text === "string") return part.text;
      return "";
    })
    .join("")
    .trim();
  if (!text) throw new Error("The Bible API returned an empty verse.");

  return {
    reference: selection.reference,
    text,
    translation: "World English Bible (WEB)",
    dateLabel: selection.dateLabel,
    licenseUrl: BIBLE_LICENSE_URL,
  };
}

function sortAndDeduplicate(articles: FaithNewsArticle[]): FaithNewsArticle[] {
  const unique = new Map<string, FaithNewsArticle>();
  for (const article of articles) {
    if (!unique.has(article.url)) unique.set(article.url, article);
  }

  return [...unique.values()].sort((left, right) => {
    if (!left.publishedAt) return 1;
    if (!right.publishedAt) return -1;
    return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  });
}

export async function GET() {
  const isProduction = process.env.NODE_ENV === "production";
  const thumbnailsEnabled = process.env.NEWS_THUMBNAILS_LICENSE_CONFIRMED === "true";
  const apiKey = process.env.NEWS_API_KEY?.trim();
  const newsApiRequest = async () => {
    if (isProduction && process.env.NEWS_API_PRODUCTION_ENABLED !== "true") {
      return [];
    }
    if (!apiKey) return [];

    const url = new URL(NEWS_API_URL);
    url.searchParams.set("q", '(christianity AND politics) OR "church news"');
    url.searchParams.set("pageSize", "3");
    url.searchParams.set("sortBy", "publishedAt");

    const response = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}.`);
    return parseNewsApi(await response.json());
  };

  try {
    const [news, scripture, ...feeds] = await Promise.all([
      readSource("News API", newsApiRequest),
      readSource("Bible API", fetchDailyScripture),
      ...FEEDS.map((feed) => readSource(feed.name, () => fetchFeed(feed, thumbnailsEnabled))),
    ]);

    const articles = sortAndDeduplicate([
      ...(news.value ?? []),
      ...feeds.flatMap((feed) => feed.value ?? []),
    ]);
    const data: FaithDashboardData = {
      articles,
      scripture: scripture.value,
      errors: [
        ...(scripture.error ? ["Daily scripture is temporarily unavailable."] : []),
        ...([news, ...feeds].some((result) => result.error)
          ? ["Some news sources are temporarily unavailable."]
          : []),
      ],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Faith dashboard data request failed:", error);
    return NextResponse.json(
      { articles: [], scripture: null, errors: ["The faith dashboard is temporarily unavailable."] },
      { status: 500 },
    );
  }
}
