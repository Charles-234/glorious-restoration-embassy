"use client";

type EventParams = Record<string, string | number | boolean | undefined>;

function isConsentGranted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("gre-consent-v1") === "accepted") return true;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(/(?:^|;\s*)gre-consent=([^;]+)/);
  return match?.[1] === "accepted";
}

/**
 * Fire a GA4 event, but only if the visitor has granted consent.
 * Church-specific event names live in CHURCH_EVENTS.
 * Kenya DPA: never pass PII in params.
 */
export function track(eventName: string, params: EventParams = {}) {
  if (!isConsentGranted()) return;
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", eventName, params);
}

export const CHURCH_EVENTS = {
  SERMON_PLAY: "sermon_play",
  SERMON_SHARE: "sermon_share",
  PRAYER_REQUEST_SUBMIT: "prayer_request_submit",
  AI_CHAT_OPEN: "ai_chat_open",
  AI_QUESTION_ASKED: "ai_question_asked",
  AI_RESPONSE_RECEIVED: "ai_response_received",
  GIVING_PAGE_VIEW: "giving_page_view",
  GIVING_METHOD_CLICK: "giving_method_click",
  LIBRARY_BOOK_CLICK: "library_book_click",
  LIVESTREAM_JOIN: "livestream_join",
  SERVICE_TIME_VIEW: "service_time_view",
} as const;