import { NextResponse } from "next/server";

export const CHAT_CALL_LIMIT = 10;

type AdmissionResult =
  | { status: "admitted"; used: number; remaining: number }
  | { status: "exhausted"; used: number; remaining: 0 }
  | { status: "unavailable"; message?: string };

export type ChatAuthorization =
  | {
      status: "authenticated";
      admitCall: () => Promise<AdmissionResult>;
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
  used: number,
  remaining: number,
): Record<string, unknown> {
  return {
    ...body,
    quotaUsed: used,
    quotaLimit: CHAT_CALL_LIMIT,
    remainingCalls: remaining,
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

    let data: { query?: unknown };
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

    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      return NextResponse.json(
        { error: "The FastAPI chat service is not configured." },
        { status: 503 },
      );
    }

    let admission: AdmissionResult;
    try {
      admission = await access.admitCall();
    } catch (error) {
      console.error("[chat] Supabase quota admission failed.", error);
      return NextResponse.json(
        { error: QUOTA_UNAVAILABLE, code: "CHAT_QUOTA_CHECK_FAILED" },
        { status: 503 },
      );
    }
    if (admission.status === "unavailable") {
      return NextResponse.json(
        { error: QUOTA_UNAVAILABLE, code: "CHAT_QUOTA_CHECK_FAILED" },
        { status: 503 },
      );
    }
    if (admission.status === "exhausted") {
      return NextResponse.json(
        withQuota(
          { error: QUOTA_EXCEEDED, code: "CHAT_QUOTA_EXCEEDED" },
          admission.used,
          admission.remaining,
        ),
        { status: 429 },
      );
    }

    const failureResponse = (error: string, status: number) =>
      NextResponse.json(
        withQuota({ error }, admission.used, admission.remaining),
        { status },
      );

    let response: Response;
    try {
      response = await fetcher(`${backendUrl.replace(/\/+$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "TimeoutError";
      const message = isTimeout
        ? "The AI assistant is waking up. Please try again in 30 seconds."
        : "The AI assistant is offline. Please try again later.";
      return failureResponse(message, isTimeout ? 504 : 503);
    }

    if (!response.ok) {
      let errorMessage = `The chat service returned an error (${response.status}).`;
      try {
        const errorBody = (await response.json()) as { detail?: unknown; error?: unknown };
        if (typeof errorBody.detail === "string") errorMessage = errorBody.detail.slice(0, 500);
        else if (typeof errorBody.error === "string") errorMessage = errorBody.error.slice(0, 500);
      } catch {
        // Keep a useful status-based message when the upstream body is not JSON.
      }
      return failureResponse(errorMessage, response.status);
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
    } catch {
      // Keep analytics persistence best-effort, as before.
    }

    return NextResponse.json(
      withQuota(
        {
          message: chatResult.answer,
          ...(Array.isArray(chatResult.sources) ? { sources: chatResult.sources } : {}),
        },
        admission.used,
        admission.remaining,
      ),
    );
  };
}
