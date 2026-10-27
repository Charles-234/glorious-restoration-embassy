"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import {
  faithNewsCategories,
  type FaithDashboardData,
  type FaithNewsArticle,
  type FaithNewsCategory,
} from "@/lib/faith-dashboard";
import styles from "./faith-dashboard.module.css";

type DashboardStatus = "loading" | "ready" | "error";
type CategoryFilter = "All" | FaithNewsCategory;

const filters: { category: CategoryFilter; label: string }[] = [
  { category: "All", label: "All" },
  ...faithNewsCategories.map((category) => ({
    category,
    label: category === "Exploration" ? "🏛️ History & Exploration" : category,
  })),
];

function formatDate(value: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function FaithDashboard() {
  const [data, setData] = useState<FaithDashboardData | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await fetch("/api/news", { signal: controller.signal });
        const result = await response.json() as FaithDashboardData;
        if (!response.ok) throw new Error("The dashboard service could not be reached.");
        setData(result);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load faith dashboard:", error);
        setStatus("error");
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, []);

  const articles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return (data?.articles ?? []).filter((article: FaithNewsArticle) => {
      const matchesQuery = !normalizedQuery ||
        `${article.title} ${article.source}`.toLocaleLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "All" || article.categories.includes(category);
      return matchesQuery && matchesCategory;
    });
  }, [category, data?.articles, query]);
  const pageCount = Math.max(1, Math.ceil(articles.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleArticles = articles.slice(pageStart, pageStart + pageSize);

  return (
    <section className={styles.section} aria-labelledby="faith-dashboard-title">
      <div className={styles.container}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Faith &amp; the world</p>
          <h1 className={styles.title} id="faith-dashboard-title">
            News &amp; Daily Scripture
          </h1>
          <p className={styles.description}>
            Daily scripture and selected reporting on faith, Kenya, Africa, and world history.
          </p>
        </header>

        {data?.scripture && (
          <article className={styles.scripture} aria-label="Daily scripture">
            <p className={styles.scriptureLabel}>Daily Scripture · {data.scripture.dateLabel}</p>
            <blockquote className={styles.verse}>{data.scripture.text}</blockquote>
            <div className={styles.scriptureFooter}>
              <p className={styles.scriptureReference}>{data.scripture.reference}</p>
              <p className={styles.scriptureAttribution}>
                {data.scripture.translation} ·{" "}
                <a href={data.scripture.licenseUrl} target="_blank" rel="noopener noreferrer">
                  Translation details
                </a>
              </p>
            </div>
          </article>
        )}

        <div className={styles.tools}>
          <label className="sr-only" htmlFor="faith-news-search">Search headlines</label>
          <input
            id="faith-news-search"
            className={styles.search}
            type="search"
            placeholder="Search headlines or sources"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
          />
          <div className={styles.filters} aria-label="Filter headlines by category">
            {filters.map((filter) => (
              <button
                key={filter.category}
                type="button"
                className={styles.filter}
                aria-pressed={category === filter.category}
                onClick={() => {
                  setCategory(filter.category);
                  setCurrentPage(1);
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {status === "loading" && (
          <p className={styles.status} role="status">Loading headlines and scripture…</p>
        )}
        {status === "error" && (
          <p className={styles.errors} role="alert">
            News and scripture could not be loaded. Please try again later.
          </p>
        )}
        {data?.errors.length ? (
          <div className={styles.errors} role="status" aria-live="polite">
            {data.errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        ) : null}

        {status === "ready" && (
          <div className={styles.grid} aria-live="polite">
            {visibleArticles.length ? visibleArticles.map((article) => (
              <article className={styles.article} data-testid="news-article" key={article.id}>
                <a
                  className={styles.articleCardLink}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read “${article.title}” directly at ${article.source}`}
                >
                  {article.imageUrl && (
                    <div className={styles.thumbnail}>
                      <Image
                        src={article.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className={styles.articleMeta}>
                    <span className={styles.source}>{article.source}</span>
                    <time dateTime={article.publishedAt ?? undefined}>
                      {formatDate(article.publishedAt)}
                    </time>
                  </div>
                  {article.author && <p className={styles.articleAuthor}>By {article.author}</p>}
                  <h3 className={styles.articleTitle}>{article.title}</h3>
                  {article.summary && <p className={styles.articleSummary}>{article.summary}</p>}
                  <span className={styles.articleLink}>
                    Read at source <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </a>
              </article>
            )) : (
              <p className={styles.empty}>
                {data?.articles.length
                  ? "No headlines match this search and category."
                  : "No headlines are available right now."}
              </p>
            )}
          </div>
        )}

        {status === "ready" && articles.length > 0 && (
          <nav className={styles.pagination} aria-label="News pages">
            <p className={styles.pageMeta}>
              Showing {pageStart + 1}–{Math.min(pageStart + pageSize, articles.length)} of{" "}
              {articles.length} headlines · Page {currentPage} of {pageCount}
            </p>
            <div className={styles.pageControls}>
              <button
                className={styles.pageButton}
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <button
                className={styles.pageButton}
                type="button"
                disabled={currentPage === pageCount}
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              >
                Next
              </button>
            </div>
          </nav>
        )}

        <p className={styles.disclaimer}>
          Headlines and dates are attributed to their publishers and link to the original
          reporting. Article text and images are not republished here.
        </p>
      </div>
    </section>
  );
}
