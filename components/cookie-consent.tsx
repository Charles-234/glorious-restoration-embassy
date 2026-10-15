"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gre-consent-v1";
const COOKIE_NAME = "gre-consent";

export type ConsentValue = "accepted" | "rejected";

function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLS = window.localStorage.getItem(STORAGE_KEY);
    if (fromLS === "accepted" || fromLS === "rejected") return fromLS;
  } catch {
    /* localStorage unavailable */
  }
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (match && (match[1] === "accepted" || match[1] === "rejected")) {
    return match[1] as ConsentValue;
  }
  return null;
}

function writeConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 180; // 180 days
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setMounted(true);
  }, []);

  const handle = (value: ConsentValue) => {
    writeConsent(value);
    setConsent(value);
    window.dispatchEvent(new CustomEvent("gre-consent-change", { detail: value }));
  };

  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-4 text-sm text-foreground shadow-lg backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5"
    >
      <p className="leading-6">
        We use essential cookies to run this site. With your permission, we would also like to
        use Google Analytics to understand how visitors use the site so we can improve it.
        Analytics is optional — you can change your mind anytime by clearing your browser
        storage.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handle("accepted")}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Accept analytics
        </button>
        <button
          type="button"
          onClick={() => handle("rejected")}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Reject non-essential
        </button>
        <a
          href="/privacy"
          className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Learn more
        </a>
      </div>
    </div>
  );
}