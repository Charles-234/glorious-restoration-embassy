import { expect, test } from "@playwright/test";
import {
  createChatPostHandler,
  type ChatAuthorization,
} from "../lib/chat-api";

const CHAT_REQUEST = () =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "  What does the document say?  " }),
  });

function createHandler({
  authorize = async (): Promise<ChatAuthorization> => ({
    status: "authenticated",
    admitCall: async () => ({ status: "admitted", used: 1, remaining: 9 }),
  }),
  backendUrl = "https://fastapi.example.test/",
  fetcher = async () =>
    Response.json({
      answer: "A RAG answer.",
      sources: [{ title: "Church document", url: "https://example.test/doc" }],
    }),
  saveConversation = async () => undefined,
}: {
  authorize?: () => Promise<ChatAuthorization>;
  backendUrl?: string | undefined;
  fetcher?: typeof fetch;
  saveConversation?: (question: string, answer: string) => Promise<unknown>;
} = {}) {
  return createChatPostHandler({
    authorize,
    getBackendUrl: () => backendUrl,
    getBackendToken: () => "test-chat-backend-secret",
    fetcher,
    saveConversation,
  });
}

test("website chat proxies to FastAPI and maps answer/sources for the client", async () => {
  let requestUrl = "";
  let requestBody: unknown;
  let requestAuthorization = "";
  const handler = createHandler({
    fetcher: async (input, init) => {
      requestUrl = String(input);
      requestBody = JSON.parse(String(init?.body));
      requestAuthorization = new Headers(init?.headers).get("Authorization") ?? "";
      return Response.json({
        answer: "A RAG answer.",
        sources: [{ title: "Church document", url: "https://example.test/doc" }],
      });
    },
  });
  const response = await handler(CHAT_REQUEST());

  expect(requestUrl).toBe("https://fastapi.example.test/api/chat");
  expect(requestBody).toEqual({
    question: "What does the document say?",
    history: [],
  });
  expect(requestAuthorization).toBe("Bearer test-chat-backend-secret");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    message: "A RAG answer.",
    sources: [{ title: "Church document", url: "https://example.test/doc" }],
    quotaUsed: 1,
    quotaLimit: 10,
    remainingCalls: 9,
    resetTimezone: "Africa/Nairobi",
  });
});

test("website chat does not call FastAPI or consume quota without backend credentials", async () => {
  let backendCalled = false;
  let quotaCalled = false;
  const handler = createChatPostHandler({
    authorize: async () => ({
      status: "authenticated",
      admitCall: async () => {
        quotaCalled = true;
        return { status: "admitted", used: 1, remaining: 9 };
      },
    }),
    getBackendUrl: () => "https://fastapi.example.test",
    getBackendToken: () => undefined,
    fetcher: async () => {
      backendCalled = true;
      return Response.json({});
    },
    saveConversation: async () => undefined,
  });

  const response = await handler(CHAT_REQUEST());
  expect(response.status).toBe(503);
  expect(backendCalled).toBe(false);
  expect(quotaCalled).toBe(false);
});

test("website chat rejects unauthenticated requests before contacting the backend", async () => {
  let backendCalled = false;
  const handler = createHandler({
    authorize: async () => ({ status: "unauthenticated" }),
    fetcher: async () => {
      backendCalled = true;
      return Response.json({});
    },
  });
  const response = await handler(CHAT_REQUEST());
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(body).toEqual({
    error: "You must be signed in to use the AI assistant.",
    code: "AUTHENTICATION_REQUIRED",
  });
  expect(backendCalled).toBe(false);
});

test("website chat permits exactly ten calls and returns a clear 429 on the next", async () => {
  let used = 0;
  let backendCalls = 0;
  const handler = createHandler({
    authorize: async () => ({
      status: "authenticated",
      admitCall: async () => {
        if (used >= 10) {
          return { status: "exhausted", used, remaining: 0 };
        }
        used += 1;
        return {
          status: "admitted",
          used,
          remaining: 10 - used,
        };
      },
    }),
    fetcher: async () => {
      backendCalls += 1;
      return Response.json({ answer: "A RAG answer." });
    },
  });

  const responses = await Promise.all(
    Array.from({ length: 11 }, () => handler(CHAT_REQUEST())),
  );

  const successfulResponses = responses.filter((response) => response.status === 200);
  const exhaustedResponse = responses.find((response) => response.status === 429);
  expect(successfulResponses).toHaveLength(10);
  expect(exhaustedResponse).toBeDefined();
  expect(backendCalls).toBe(10);
  const remainingCounts = await Promise.all(
    successfulResponses.map(async (response) => (await response.json()).remainingCalls),
  );
  expect(remainingCounts.sort((first, second) => first - second)).toEqual([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
  expect(await exhaustedResponse?.json()).toEqual({
    error:
      "No AI assistant calls remain available in today's allowance. It resets at midnight Africa/Nairobi time.",
    code: "CHAT_QUOTA_EXCEEDED",
    quotaUsed: 10,
    quotaLimit: 10,
    remainingCalls: 0,
    resetTimezone: "Africa/Nairobi",
  });
  expect(used).toBe(10);
});

test("website chat does not consume a call for an invalid question", async () => {
  let quotaConsumed = false;
  const handler = createHandler({
    authorize: async () => ({
      status: "authenticated",
      admitCall: async () => {
        quotaConsumed = true;
        return { status: "admitted", used: 1, remaining: 9 };
      },
    }),
  });
  const response = await handler(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "  " }),
    }),
  );

  expect(response.status).toBe(400);
  expect(quotaConsumed).toBe(false);
});

test("website chat surfaces FastAPI errors using the existing error field", async () => {
  const handler = createHandler({
    fetcher: async () =>
      Response.json(
        { detail: "The AI assistant is temporarily unavailable. Please try again later." },
        { status: 502 },
      ),
  });
  const response = await handler(CHAT_REQUEST());

  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({
    error: "The AI assistant is temporarily unavailable. Please try again later.",
    quotaUsed: 1,
    quotaLimit: 10,
    remainingCalls: 9,
    resetTimezone: "Africa/Nairobi",
  });
});

test("failed FastAPI calls remain counted as admitted attempts", async () => {
  let used = 0;
  let nextCallFails = true;
  const handler = createHandler({
    authorize: async () => ({
      status: "authenticated",
      admitCall: async () => {
        if (used >= 10) {
          return { status: "exhausted", used, remaining: 0 };
        }
        used += 1;
        return {
          status: "admitted",
          used,
          remaining: 10 - used,
        };
      },
    }),
    fetcher: async () => {
      if (nextCallFails) {
        nextCallFails = false;
        return Response.json({ detail: "Temporary error." }, { status: 502 });
      }
      return Response.json({ answer: "A successful answer." });
    },
  });

  const failedResponse = await handler(CHAT_REQUEST());
  const successfulResponse = await handler(CHAT_REQUEST());

  expect(failedResponse.status).toBe(502);
  expect(successfulResponse.status).toBe(200);
  expect(await failedResponse.json()).toMatchObject({
    quotaUsed: 1,
    quotaLimit: 10,
    remainingCalls: 9,
  });
  expect(await successfulResponse.json()).toMatchObject({
    quotaUsed: 2,
    quotaLimit: 10,
    remainingCalls: 8,
  });
  expect(used).toBe(2);
});
