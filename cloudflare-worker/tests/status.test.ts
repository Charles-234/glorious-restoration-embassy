import assert from "node:assert/strict";
import test from "node:test";
import { createBot } from "../src/index";

async function sendBlogCommand(
  userId: number,
  options: { superAdminTelegramId?: string; adminsFile?: unknown } = {},
): Promise<{ replies: string[]; writes: number }> {
  const bot = createBot({
    TELEGRAM_BOT_TOKEN: "123456789:local-test-token",
    TELEGRAM_WEBHOOK_SECRET: "local-test-secret",
    GITHUB_TOKEN: "local-test-github-token",
    GITHUB_REPO: "church/site",
    ...(options.superAdminTelegramId
      ? { SUPER_ADMIN_TELEGRAM_ID: options.superAdminTelegramId }
      : {}),
  });
  const replies: string[] = [];
  let writes = 0;

  bot.api.config.use(async (_previous, method, payload) => {
    if (method === "getMe") {
      return {
        ok: true,
        result: { id: 1, is_bot: true, first_name: "Local", username: "local_test_bot" },
      } as never;
    }
    assert.equal(method, "sendMessage");
    replies.push(String(payload.text));
    return {
      ok: true,
      result: {
        message_id: 1,
        date: 1,
        chat: { id: Number(payload.chat_id), type: "private" },
        text: String(payload.text),
      },
    } as never;
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/content/admins.json")) {
      return Response.json({
        encoding: "base64",
        content: btoa(JSON.stringify(options.adminsFile ?? { super_admin: "Charles-234", admins: [] })),
      });
    }
    if (init?.method === "PUT") {
      writes += 1;
      return Response.json({ commit: { sha: "test-commit" }, content: { html_url: url } });
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    await bot.init();
    await bot.handleUpdate({
      update_id: userId,
      message: {
        message_id: userId,
        date: 1,
        chat: { id: userId, type: "private", first_name: "Test" },
        from: { id: userId, is_bot: false, first_name: "Test" },
        text: "/blog Test === Content",
        entities: [{ type: "bot_command", offset: 0, length: 5 }],
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  return { replies, writes };
}

test("the /status command reports the Worker and configured repository", async () => {
  const bot = createBot({
    TELEGRAM_BOT_TOKEN: "123456789:local-test-token",
    TELEGRAM_WEBHOOK_SECRET: "local-test-secret",
    GITHUB_TOKEN: "local-test-github-token",
    GITHUB_REPO: "church/site",
    KOYEB_BACKEND_URL: "https://example.koyeb.app",
  });
  const replies: string[] = [];

  bot.api.config.use(async (_previous, method, payload) => {
    if (method === "getMe") {
      return {
        ok: true,
        result: { id: 1, is_bot: true, first_name: "Local", username: "local_test_bot" },
      } as never;
    }
    assert.equal(method, "sendMessage");
    replies.push(String(payload.text));
    return {
      ok: true,
      result: {
        message_id: 1,
        date: 1,
        chat: { id: Number(payload.chat_id), type: "private" },
        text: String(payload.text),
      },
    } as never;
  });

  await bot.init();
  await bot.handleUpdate({
    update_id: 1,
    message: {
      message_id: 1,
      date: 1,
      chat: { id: 42, type: "private", first_name: "Test" },
      from: { id: 42, is_bot: false, first_name: "Test" },
      text: "/status",
      entities: [{ type: "bot_command", offset: 0, length: 7 }],
    },
  });

  assert.deepEqual(replies, ["Bot status: online\nRepository: church/site"]);
});

test("GitHub super_admin username does not grant access without numeric Telegram mapping", async () => {
  const result = await sendBlogCommand(42);

  assert.deepEqual(result.replies, ["Access denied"]);
  assert.equal(result.writes, 0);
});

test("configured super-admin Telegram ID maps the GitHub super_admin account", async () => {
  const result = await sendBlogCommand(42, { superAdminTelegramId: "42" });

  assert.equal(result.writes, 1);
  assert.match(result.replies[0], /^Published\./);
});

test("numeric Telegram IDs in admins remain authorized", async () => {
  const result = await sendBlogCommand(42, {
    adminsFile: { super_admin: "Charles-234", admins: [42] },
  });

  assert.equal(result.writes, 1);
  assert.match(result.replies[0], /^Published\./);
});

test("ordinary Telegram messages are sent to the shared FastAPI chat endpoint", async () => {
  const bot = createBot({
    TELEGRAM_BOT_TOKEN: "123456789:local-test-token",
    TELEGRAM_WEBHOOK_SECRET: "local-test-secret",
    GITHUB_TOKEN: "local-test-github-token",
    GITHUB_REPO: "church/site",
    FASTAPI_BACKEND_URL: "https://api.example.test/",
  });
  const replies: string[] = [];
  let requestUrl = "";
  let requestBody: unknown;

  bot.api.config.use(async (_previous, method, payload) => {
    if (method === "getMe") {
      return {
        ok: true,
        result: { id: 1, is_bot: true, first_name: "Local", username: "local_test_bot" },
      } as never;
    }
    assert.equal(method, "sendMessage");
    replies.push(String(payload.text));
    return {
      ok: true,
      result: {
        message_id: 1,
        date: 1,
        chat: { id: Number(payload.chat_id), type: "private" },
        text: String(payload.text),
      },
    } as never;
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body));
    return Response.json({
      answer: "A sourced answer.",
      sources: [{ title: "A source", url: "https://example.test/source", type: "document" }],
    });
  };

  try {
    await bot.init();
    await bot.handleUpdate({
      update_id: 2,
      message: {
        message_id: 2,
        date: 1,
        chat: { id: 42, type: "private", first_name: "Test" },
        from: { id: 42, is_bot: false, first_name: "Test" },
        text: "What does the source say?",
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requestUrl, "https://api.example.test/api/chat");
  assert.deepEqual(requestBody, { question: "What does the source say?" });
  assert.deepEqual(replies, [
    "A sourced answer.\n\nSources:\n- A source: https://example.test/source",
  ]);
});
