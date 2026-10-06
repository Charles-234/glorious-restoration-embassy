import { NextResponse } from "next/server";
import { saveAIConversation } from "../../../lib/supabaseClient";

const BACKEND_URL = process.env.FASTAPI_BACKEND_URL || process.env.KOYEB_BACKEND_URL;

export async function POST(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "The FastAPI chat service is not configured." },
      { status: 503 },
    );
  }

  let data: { query?: unknown };
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  const query = typeof data?.query === "string" ? data.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL.replace(/\/+$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "The chat service took too long to respond. Please try again."
        : "The chat service is temporarily unavailable. Please try again.";
    return NextResponse.json({ error: message }, { status: 503 });
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
    return NextResponse.json({ error: errorMessage }, { status: response.status });
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    return NextResponse.json(
      { error: "The chat service returned an invalid response." },
      { status: 502 },
    );
  }
  if (!result || typeof result !== "object") {
    return NextResponse.json(
      { error: "The chat service returned an invalid response." },
      { status: 502 },
    );
  }
  const chatResult = result as { answer?: unknown; sources?: unknown };

  const message =
    typeof chatResult.answer === "string" && chatResult.answer.trim()
      ? chatResult.answer
      : "Sorry, I couldn't generate a response.";

  try {
    await saveAIConversation(query, message);
  } catch {
    // Ignore analytics persistence errors.
  }

  return NextResponse.json({
    message,
    ...(Array.isArray(chatResult.sources) ? { sources: chatResult.sources } : {}),
  });
}
