import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("website chat proxies to FastAPI and maps answer/sources for the client", async () => {
  const previousBackendUrl = process.env.FASTAPI_BACKEND_URL;
  const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestBody: unknown;
  process.env.FASTAPI_BACKEND_URL = "https://fastapi.example.test/";
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body));
    return Response.json({
      answer: "A RAG answer.",
      sources: [{ title: "Church document", url: "https://example.test/doc" }],
    });
  };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const { POST } = await import("../app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "  What does the document say?  " }),
      }),
    );

    expect(requestUrl).toBe("https://fastapi.example.test/api/chat");
    expect(requestBody).toEqual({ question: "What does the document say?" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "A RAG answer.",
      sources: [{ title: "Church document", url: "https://example.test/doc" }],
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousBackendUrl === undefined) delete process.env.FASTAPI_BACKEND_URL;
    else process.env.FASTAPI_BACKEND_URL = previousBackendUrl;
    if (previousSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl;
    if (previousSupabaseKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousSupabaseKey;
  }
});

test("website chat surfaces FastAPI errors using the existing error field", async () => {
  const previousBackendUrl = process.env.FASTAPI_BACKEND_URL;
  const originalFetch = globalThis.fetch;
  process.env.FASTAPI_BACKEND_URL = "https://fastapi.example.test";
  globalThis.fetch = async () =>
    Response.json(
      { detail: "The AI assistant is temporarily unavailable. Please try again later." },
      { status: 502 },
    );

  try {
    const { POST } = await import("../app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "Please help" }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "The AI assistant is temporarily unavailable. Please try again later.",
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousBackendUrl === undefined) delete process.env.FASTAPI_BACKEND_URL;
    else process.env.FASTAPI_BACKEND_URL = previousBackendUrl;
  }
});
