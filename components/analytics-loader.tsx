"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { ConsentValue } from "@/components/cookie-consent";

const GA_ID = "G-KHTD567MYY";
const STORAGE_KEY = "gre-consent-v1";
const COOKIE_NAME = "gre-consent";

function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLS = window.localStorage.getItem(STORAGE_KEY);
    if (fromLS === "accepted" || fromLS === "rejected") return fromLS;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (match && (match[1] === "accepted" || match[1] === "rejected")) {
    return match[1] as ConsentValue;
  }
  return null;
}

export function AnalyticsLoader() {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setConsent(readConsent());
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentValue>).detail;
      setConsent(detail);
    };
    window.addEventListener("gre-consent-change", handler);
    return () => window.removeEventListener("gre-consent-change", handler);
  }, []);

  // App Router does not auto-track navigations. Manually emit page_view on route change.
  useEffect(() => {
    if (consent !== "accepted") return;
    if (typeof window === "undefined") return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== "function") return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    w.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams, consent]);

  // GA4 only mounts after explicit consent — this is the Kenya DPA gate.
  if (consent !== "accepted") return null;
  return <GoogleAnalytics gaId={GA_ID} />;
}