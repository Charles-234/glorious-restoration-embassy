import { Bot, webhookCallback, type Context } from "grammy";

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  TELEGRAM_WEBHOOK_PATH?: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  SUPER_ADMIN_TELEGRAM_ID?: string;
  FASTAPI_BACKEND_URL?: string;
  KOYEB_BACKEND_URL?: string;
}

interface GitHubFileResponse {
  content?: string;
  encoding?: string;
  sha?: string;
  html_url?: string;
}

interface GitHubCommitResponse {
  commit?: { sha?: string };
  content?: { html_url?: string };
}

interface AdminsFile {
  admins?: Array<string | number>;
}

interface ChatResponse {
  answer?: string;
  sources?: Array<{ title?: string; url?: string; type?: string }>;
}

function githubFileUrl(env: Env, path: string): string {
  const [owner, repository] = env.GITHUB_REPO.split("/");
  if (!owner || !repository || env.GITHUB_REPO.split("/").length !== 2) {
    throw new Error("GITHUB_REPO must use the owner/repository format.");
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${encodedPath}`;
}

function githubHeaders(env: Env, accept = "application/vnd.github+json"): HeadersInit {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured.");
  return {
    Accept: accept,
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "glorious-restoration-embassy-bot",
  };
}

async function githubError(response: Response): Promise<Error> {
  const detail = (await response.text()).slice(0, 300);
  return new Error(`GitHub API returned ${response.status}${detail ? `: ${detail}` : ""}`);
}

function decodeBase64(value: string): string {
  const bytes = Uint8Array.from(atob(value.replace(/\s/g, "")), (character) =>
    character.charCodeAt(0),
  );
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function normalizeTelegramId(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? String(parsed) : null;
}

async function isAdmin(env: Env, userId: number | undefined): Promise<boolean> {
  const telegramId = normalizeTelegramId(userId);
  if (!telegramId) return false;

  const superAdminTelegramId = normalizeTelegramId(env.SUPER_ADMIN_TELEGRAM_ID);
  if (superAdminTelegramId && superAdminTelegramId === telegramId) return true;

  const response = await fetch(githubFileUrl(env, "content/admins.json"), {
    headers: githubHeaders(env),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw await githubError(response);

  const file = (await response.json()) as GitHubFileResponse;
  if (file.encoding !== "base64" || !file.content) {
    throw new Error("content/admins.json is missing or is not base64 encoded.");
  }

  const admins = JSON.parse(decodeBase64(file.content)) as AdminsFile;
  return (
    Array.isArray(admins.admins) &&
    admins.admins.some((id) => normalizeTelegramId(id) === telegramId)
  );
}

async function requireAdmin(ctx: Context, env: Env): Promise<boolean> {
  try {
    if (await isAdmin(env, ctx.from?.id)) return true;
    await ctx.reply("Access denied");
  } catch (error) {
    console.error("Admin verification failed:", error);
    await ctx.reply("Admin verification is temporarily unavailable. Please try again later.");
  }
  return false;
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/g, "");
  return slug || "untitled";
}

function commandParts(value: string, expected: number): string[] | null {
  const parts = value.split("===").map((part) => part.trim());
  return parts.length === expected && parts.every(Boolean) ? parts : null;
}

async function commitFile(
  env: Env,
  path: string,
  bytes: Uint8Array,
  message: string,
): Promise<{ sha: string; url: string }> {
  const url = githubFileUrl(env, path);
  const headers = githubHeaders(env);
  const existingResponse = await fetch(url, { headers });
  let existingSha: string | undefined;

  if (existingResponse.ok) {
    existingSha = (await existingResponse.json() as GitHubFileResponse).sha;
  } else if (existingResponse.status !== 404) {
    throw await githubError(existingResponse);
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: encodeBase64(bytes),
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });
  if (!response.ok) throw await githubError(response);

  const result = (await response.json()) as GitHubCommitResponse;
  return {
    sha: result.commit?.sha ?? "unknown",
    url:
      result.content?.html_url ??
      `https://github.com/${env.GITHUB_REPO}/blob/HEAD/${path}`,
  };
}

async function commitText(
  ctx: Context,
  env: Env,
  path: string,
  contents: string,
  message: string,
): Promise<void> {
  const result = await commitFile(env, path, new TextEncoder().encode(contents), message);
  await ctx.reply(`Published. Commit: ${result.sha}\n${result.url}`);
}

async function handleCmsCommand(
  ctx: Context,
  env: Env,
  operation: () => Promise<void>,
): Promise<void> {
  if (!(await requireAdmin(ctx, env))) return;
  try {
    await operation();
  } catch (error) {
    console.error("CMS command failed:", error);
    await ctx.reply("The content could not be published. Please check the Worker logs and try again.");
  }
}

export function createBot(env: Env): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Welcome to the Glorious Restoration Embassy bot.\n\n" +
        "Commands:\n" +
        "/help - Show commands\n" +
        "/status - Show bot status\n" +
        "/blog Title === Content\n" +
        "/sermon Title === VideoURL === Description\n" +
        "/event Title === Date === Location === Description\n" +
        "/link Title === URL\n" +
        "Send a photo with the caption /upload to add it to the gallery.",
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "CMS commands (admin access required):\n" +
        "/blog Title === Content\n" +
        "/sermon Title === VideoURL === Description\n" +
        "/event Title === Date === Location === Description\n" +
        "/link Title === URL\n" +
        "Send a photo with the caption /upload to add it to the gallery.\n" +
        "/status - Show bot status",
    );
  });

  bot.command("status", async (ctx) => {
    const repository = env.GITHUB_REPO || "not configured";
    await ctx.reply(`Bot status: online\nRepository: ${repository}`);
  });

  bot.command("blog", async (ctx) => {
    await handleCmsCommand(ctx, env, async () => {
      const parts = commandParts(String(ctx.match ?? ""), 2);
      if (!parts) {
        await ctx.reply("Format: /blog Title === Content");
        return;
      }
      const [title, content] = parts;
      const markdown = `---\ntitle: ${JSON.stringify(title)}\ndate: ${new Date().toISOString()}\n---\n\n${content}\n`;
      await commitText(
        ctx,
        env,
        `content/blog/${slugify(title)}.md`,
        markdown,
        `Add blog post: ${title}`,
      );
    });
  });

  bot.command("sermon", async (ctx) => {
    await handleCmsCommand(ctx, env, async () => {
      const parts = commandParts(String(ctx.match ?? ""), 3);
      if (!parts) {
        await ctx.reply("Format: /sermon Title === VideoURL === Description");
        return;
      }
      const [title, videoUrl, description] = parts;
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(videoUrl);
      } catch {
        await ctx.reply("VideoURL must be a valid HTTPS URL.");
        return;
      }
      if (parsedUrl.protocol !== "https:") {
        await ctx.reply("VideoURL must be a valid HTTPS URL.");
        return;
      }
      const record = {
        title,
        speaker: "Glorious Restoration Embassy",
        date: new Date().toISOString(),
        summary: description,
        videoUrl: parsedUrl.toString(),
        mediaType: "embed",
      };
      await commitText(
        ctx,
        env,
        `content/sermons/${slugify(title)}.json`,
        `${JSON.stringify(record, null, 2)}\n`,
        `Add sermon: ${title}`,
      );
    });
  });

  bot.command("event", async (ctx) => {
    await handleCmsCommand(ctx, env, async () => {
      const parts = commandParts(String(ctx.match ?? ""), 4);
      if (!parts) {
        await ctx.reply("Format: /event Title === Date === Location === Description");
        return;
      }
      const [title, date, location, description] = parts;
      const record = { title, date, venue: location, description, badge: "Upcoming" };
      await commitText(
        ctx,
        env,
        `content/events/${slugify(title)}.json`,
        `${JSON.stringify(record, null, 2)}\n`,
        `Add event: ${title}`,
      );
    });
  });

  bot.command("link", async (ctx) => {
    await handleCmsCommand(ctx, env, async () => {
      const parts = commandParts(String(ctx.match ?? ""), 2);
      if (!parts) {
        await ctx.reply("Format: /link Title === URL");
        return;
      }
      const [title, link] = parts;
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(link);
      } catch {
        await ctx.reply("URL must be a valid HTTPS URL.");
        return;
      }
      if (parsedUrl.protocol !== "https:") {
        await ctx.reply("URL must be a valid HTTPS URL.");
        return;
      }
      const markdown = `---\ntitle: ${JSON.stringify(title)}\nurl: ${JSON.stringify(parsedUrl.toString())}\n---\n`;
      await commitText(
        ctx,
        env,
        `content/resources/${slugify(title)}.md`,
        markdown,
        `Add resource link: ${title}`,
      );
    });
  });

  bot.command("upload", async (ctx) => {
    if (!(await requireAdmin(ctx, env))) return;
    await ctx.reply("Send a photo with /upload as its caption to add it to the gallery.");
  });

  bot.on("message:photo", async (ctx) => {
    await handleCmsCommand(ctx, env, async () => {
      const photo = ctx.message.photo.at(-1);
      if (!photo) {
        await ctx.reply("Please attach a photo.");
        return;
      }
      const telegramFile = await ctx.api.getFile(photo.file_id);
      if (!telegramFile.file_path) throw new Error("Telegram did not return a photo file path.");

      const download = await fetch(
        `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${telegramFile.file_path}`,
      );
      if (!download.ok) throw new Error(`Telegram photo download failed (${download.status}).`);

      const fileName = `${slugify(photo.file_unique_id)}.jpg`;
      const result = await commitFile(
        env,
        `public/gallery/${fileName}`,
        new Uint8Array(await download.arrayBuffer()),
        `Add gallery photo: ${fileName}`,
      );
      await ctx.reply(`Photo published. Commit: ${result.sha}\n${result.url}`);
    });
  });

  bot.on("message:text", async (ctx) => {
    const question = ctx.message.text.trim();
    if (!question || question.startsWith("/")) return;

    const baseUrl = (env.FASTAPI_BACKEND_URL || env.KOYEB_BACKEND_URL)?.replace(/\/+$/, "");
    if (!baseUrl) {
      await ctx.reply("The AI assistant is not configured yet.");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (response.status === 502 || response.status === 503 || response.status === 504) {
        await ctx.reply("The AI assistant is waking up. Please try again in 30 seconds.");
        return;
      }
      if (!response.ok) {
        console.error("Koyeb chat returned status:", response.status);
        await ctx.reply("The AI assistant could not answer right now. Please try again later.");
        return;
      }

      const result = (await response.json()) as ChatResponse;
      const answer = result.answer?.trim();
      if (!answer) {
        await ctx.reply("The AI assistant returned an empty response. Please try again.");
        return;
      }
      const sourceLines = (result.sources ?? [])
        .filter((source) => source.url)
        .slice(0, 5)
        .map((source) => `- ${source.title || "Source"}: ${source.url}`);
      await ctx.reply(
        sourceLines.length ? `${answer}\n\nSources:\n${sourceLines.join("\n")}` : answer,
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        await ctx.reply("The AI assistant is waking up. Please try again in 30 seconds.");
        return;
      }
      console.error("Koyeb chat request failed:", error);
      await ctx.reply("The AI assistant is temporarily unavailable. Please try again later.");
    } finally {
      clearTimeout(timeout);
    }
  });

  return bot;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ status: "ok", service: "glorious-bot" });
    }

    const webhookPath = env.TELEGRAM_WEBHOOK_PATH || "/telegram";
    if (request.method !== "POST" || url.pathname !== webhookPath) {
      return new Response("Not found", { status: 404 });
    }
    if (!env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Webhook secret is not configured", { status: 503 });
    }
    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (!env.TELEGRAM_BOT_TOKEN) {
      return new Response("Bot token is not configured", { status: 503 });
    }

    return webhookCallback(createBot(env), "cloudflare-mod")(request);
  },
};
