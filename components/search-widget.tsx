"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { searchIndex, siteConfig } from "@/lib/siteData";

export function SearchWidget() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) {
      return searchIndex.slice(0, 4);
    }

    const normalized = query.toLowerCase();
    return searchIndex.filter((item) => item.title.toLowerCase().includes(normalized) || item.description.toLowerCase().includes(normalized)).slice(0, 6);
  }, [query]);

  return (
    <div className="readable-surface rounded-[2.5rem] p-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Search size={24} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-accent">Smart search</p>
            <h2 className="text-3xl font-semibold text-foreground">Find sermons, ministries, and events instantly.</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-muted p-4">
          <label htmlFor="search-query" className="sr-only">
            Search {siteConfig.brandName}
          </label>
          <input
            id="search-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sermons, live stream, branches, events..."
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="space-y-4">
          {results.length ? (
            results.map((item) => (
              <div key={`${item.title}-${item.href}`} className="rounded-3xl border border-border bg-muted p-5 transition hover:border-primary/30 hover:bg-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.32em] text-accent">{item.category}</p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <Sparkles className="text-primary" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-border bg-muted p-5 text-muted-foreground">
              No results found. Try searching for &quot;worship&quot;, &quot;leadership&quot;, or &quot;livestream&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
