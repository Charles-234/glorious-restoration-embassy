import { NextResponse } from "next/server";

export const CHAT_CALL_LIMIT = 10;

type AdmissionResult =
  | { status: "admitted"; used: number; remaining: number }
  | { status: "exhausted"; used: number; remaining: 0 }
  | { status: "unlimited" }
  | { status: "unavailable"; message?: string };

type QuotaAdmission = Exclude<AdmissionResult, { status: "unavailable" }>;

export type ChatAuthorization =
  | {
      status: "authenticated";
      adminUnlimited?: boolean;
      admitCall?: () => Promise<AdmissionResult>;
    }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

type ChatPostDependencies = {
  authorize: () => Promise<ChatAuthorization>;
  getBackendUrl: () => string | undefined;
  fetcher: typeof fetch;
  saveConversation: (question: string, answer: string) => Promise<unknown>;
};

const AUTHENTICATION_REQUIRED = "You must be signed in to use the AI assistant.";
const QUOTA_EXCEEDED =
  "No AI assistant calls remain available in today's allowance. It resets at midnight Africa/Nairobi time.";
const QUOTA_UNAVAILABLE =
  "We couldn't verify your AI assistant allowance. Please try again later.";

function withQuota(
  body: Record<string, unknown>,
  admission: QuotaAdmission,
): Record<string, unknown> {
  if (admission.status === "unlimited") {
    return { ...body, quotaUnlimited: true };
  }

  return {
    ...body,
    quotaUsed: admission.used,
    quotaLimit: CHAT_CALL_LIMIT,
    remainingCalls: admission.remaining,
    resetTimezone: "Africa/Nairobi",
  };
}

export function createChatPostHandler({
  authorize,
  getBackendUrl,
  fetcher,
  saveConversation,
}: ChatPostDependencies) {
  return async function POST(request: Request): Promise<NextResponse> {
    let access: ChatAuthorization;
    try {
      access = await authorize();
    } catch (error) {
      console.error("[chat] Supabase authorization failed.", error);
      return NextResponse.json(
        { error: "Authentication is temporarily unavailable. Please try again." },
        { status: 503 },
      );
    }

    if (access.status === "unauthenticated") {
      return NextResponse.json(
        { error: AUTHENTICATION_REQUIRED, code: "AUTHENTICATION_REQUIRED" },
        { status: 401 },
      );
    }
    if (access.status === "unavailable") {
      return NextResponse.json(
        { error: "Authentication is temporarily unavailable. Please try again." },
        { status: 503 },
      );
    }

    let data: { query?: unknown; history?: unknown };
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { error: "A valid JSON request is required." },
        { status: 400 },
      );
    }

    const query = typeof data?.query === "string" ? data.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }
    if (query.length > 4000) {
      return NextResponse.json(
        { error: "Please keep your question under 4,000 characters." },
        { status: 413 },
      );
    }

    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      console.error("[chat] FastAPI backend URL is not configured.");
      return NextResponse.json(
        { error: "The AI assistant is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

    let admission: AdmissionResult;
    if (access.adminUnlimited) {
      admission = { status: "unlimited" };
    } else {
      if (!access.admitCall) {
        console.error("[chat] Authenticated user has no quota admission handler.");
        return NextResponse.json(
          { error: QUOTA_UNAVAILABLE, code: "CHAT_QUOTA_CHECK_FAILED" },
          { status: 503 },
        );
      }
      try {
        admission = await access.admitCall();
      } catch (error) {
        console.error("[chat] Supabase quota admission failed.", error);
        return NextResponse.json(
          { error: QUOTA_UNAVAILABLE, code: "CHAT_QUOTA_CHECK_FAILED" },
          { status: 503 },
        );
      }
    }
    if (admission.status === "unavailable") {
      return NextResponse.json(
        { error: QUOTA_UNAVAILABLE, code: "CHAT_QUOTA_CHECK_FAILED" },
        { status: 503 },
      );
    }
    if (admission.status === "exhausted") {
      return NextResponse.json(
        withQuota({ error: QUOTA_EXCEEDED, code: "CHAT_QUOTA_EXCEEDED" }, admission),
        { status: 429 },
      );
    }

    const failureResponse = (error: string, status: number) =>
      NextResponse.json(
        withQuota({ error }, admission),
        { status },
      );

    let response: Response;
    try {
      response = await fetcher(`${backendUrl.replace(/\/+$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, history: (data as any).history ?? [] }),
        // CHAT DEBUG: forwarding
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "TimeoutError";
      console.error("[chat] FastAPI backend request failed.", {
        backendConfigured: Boolean(backendUrl),
        errorName: error instanceof Error ? error.name : "UnknownError",
        reason: error instanceof Error ? error.message : "Unknown transport failure",
      });
      const message = isTimeout
        ? "The AI assistant is taking longer than expected. Please try again shortly."
        : "The AI assistant is temporarily unavailable. Please try again later.";
      return failureResponse(message, isTimeout ? 504 : 503);
    }

    if (!response.ok) {
      console.error("[chat] FastAPI backend returned a non-success response.", {
        status: response.status,
      });
      return failureResponse(
        "The AI assistant is temporarily unavailable. Please try again later.",
        502,
      );
    }

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      return failureResponse("The chat service returned an invalid response.", 502);
    }
    if (!result || typeof result !== "object") {
      return failureResponse("The chat service returned an invalid response.", 502);
    }
    const chatResult = result as { answer?: unknown; sources?: unknown };
    if (typeof chatResult.answer !== "string" || !chatResult.answer.trim()) {
      return failureResponse("The chat service returned an invalid response.", 502);
    }

    try {
      await saveConversation(query, chatResult.answer);
    } catch (error) {
      console.error("[chat] Could not persist the conversation.", error);
    }

    return NextResponse.json(
      withQuota({
        message: chatResult.answer,
        ...(Array.isArray(chatResult.sources) ? { sources: chatResult.sources } : {}),
      }, admission),
    );
  };
}
