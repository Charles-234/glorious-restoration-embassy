import assert from "node:assert/strict";
import test from "node:test";
import { createBot } from "../src/index";

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
