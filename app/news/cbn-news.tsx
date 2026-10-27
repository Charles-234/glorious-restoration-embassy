import { XMLParser } from "fast-xml-parser";
import styles from "./cbn-news.module.css";

const CBN_FEED_URL = "https://www1.cbn.com/rss-cbn-articles-cbnnews.xml";
const CBN_NEWS_URL = "https://www1.cbn.com/cbnnews";
const MAX_DESCRIPTION_LENGTH = 200;

type FeedRecord = Record<string, unknown>;

type CbnArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string | null;
};

function isRecord(value: unknown): value is FeedRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isRecord(value)) return "";
  if (typeof value["#text"] === "string") return value["#text"];
  if (typeof value["__cdata"] === "string") return value["__cdata"];
  return "";
}

function plainText(value: unknown): string {
  return textValue(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&apos;|&#39;|&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function descriptionSnippet(value: unknown): string {
  const description = plainText(value);
  if (description.length <= MAX_DESCRIPTION_LENGTH) return description;

  const truncated = description.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : truncated.length).trimEnd()}…`;
}

function cbnArticleUrl(value: unknown): string | null {
  const rawUrl = textValue(value).trim();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      (hostname !== "cbn.com" && !hostname.endsWith(".cbn.com"))
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function parseCbnFeed(xml: string): CbnArticle[] {
  const parsed: unknown = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  }).parse(xml);

  if (!isRecord(parsed) || !isRecord(parsed.rss) || !isRecord(parsed.rss.channel)) {
    throw new Error("CBN RSS response did not contain a channel.");
  }

  const rawItems = parsed.rss.channel.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  const articles = items.flatMap((item): CbnArticle[] => {
    if (!isRecord(item)) return [];

    const title = plainText(item.title);
    const link = cbnArticleUrl(item.link);
    if (!title || !link) return [];

    const rawPubDate = textValue(item.pubDate).trim();
    const parsedDate = rawPubDate ? Date.parse(rawPubDate) : Number.NaN;

    return [{
      title,
      description: descriptionSnippet(item.description),
      link,
      pubDate: Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString() : null,
    }];
  });

  if (!articles.length) {
    throw new Error("CBN RSS response did not contain any valid articles.");
  }

  return articles
    .sort((left, right) => {
      if (!left.pubDate) return 1;
      if (!right.pubDate) return -1;
      return Date.parse(right.pubDate) - Date.parse(left.pubDate);
    })
    .slice(0, 8);
}

async function fetchCbnArticles(): Promise<CbnArticle[]> {
  const response = await fetch(CBN_FEED_URL, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "GloryEmbassyNewsBot/1.0 (+https://glory-embassy-of-grace.vercel.app)",
    },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`CBN RSS returned HTTP ${response.status}.`);
  }

  return parseCbnFeed(await response.text());
}

export async function CbnNews() {
  let articles: CbnArticle[];
  try {
    articles = await fetchCbnArticles();
  } catch (error) {
    console.error("[news] CBN News feed request failed.", error);
    return (
      <section className={styles.section} aria-labelledby="cbn-news-title">
        <div className={styles.container}>
          <h2 className={styles.title} id="cbn-news-title">CBN News</h2>
          <p className={styles.fallback}>
            CBN News is temporarily unavailable.{" "}
            <a href={CBN_NEWS_URL} target="_blank" rel="noopener noreferrer">
              Visit CBN News directly →
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="cbn-news-title">
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Latest headlines</p>
            <h2 className={styles.title} id="cbn-news-title">CBN News</h2>
          </div>
        </header>
        <div className={styles.grid}>
          {articles.map((article) => (
            <article className={styles.article} key={article.link}>
              <h3 className={styles.headline}>{article.title}</h3>
              {article.description && <p className={styles.description}>{article.description}</p>}
              {article.pubDate && (
                <time className={styles.date} dateTime={article.pubDate}>
                  {new Intl.DateTimeFormat("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(article.pubDate))}
                </time>
              )}
              <a
                className={styles.storyLink}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Full Story on CBN →
              </a>
            </article>
          ))}
        </div>
        <p className={styles.allNews}>
          <a href={CBN_NEWS_URL} target="_blank" rel="noopener noreferrer">
            All CBN News →
          </a>
        </p>
      </div>
    </section>
  );
}
