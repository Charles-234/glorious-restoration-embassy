from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import httpx
from github import Github

REPO_ROOT = Path(__file__).resolve().parent.parent
CONTENT_ROOT = REPO_ROOT / "content"
ADMINS_PATH = CONTENT_ROOT / "admins.json"


def get_admin_ids() -> set[int]:
    if not ADMINS_PATH.exists():
        return set()
    try:
        data = json.loads(ADMINS_PATH.read_text(encoding="utf-8"))
        raw_admins = data.get("admins", [])
        if not isinstance(raw_admins, list):
            return set()
        return {
            int(item)
            for item in raw_admins
            if (isinstance(item, int) and not isinstance(item, bool) and item > 0)
            or (isinstance(item, str) and item.isdecimal() and int(item) > 0)
        }
    except (AttributeError, TypeError, ValueError, OSError):
        return set()


def is_admin(user_id: int | None) -> bool:
    if not isinstance(user_id, int) or isinstance(user_id, bool) or user_id <= 0:
        return False

    # GitHub usernames in admins.json are not Telegram identities. The
    # operator must explicitly map the super-admin account to its Telegram ID.
    configured_super_admin_id = os.getenv("SUPER_ADMIN_TELEGRAM_ID", "")
    if configured_super_admin_id.isdecimal() and int(configured_super_admin_id) == user_id:
        return True

    return user_id in get_admin_ids()


async def request_assistant_answer(question: str) -> dict[str, Any]:
    base_url = (
        os.getenv("FASTAPI_BACKEND_URL") or os.getenv("KOYEB_BACKEND_URL") or ""
    ).rstrip("/")
    if not base_url:
        raise RuntimeError("The FastAPI chat service is not configured.")
    shared_secret = os.getenv("CHAT_BACKEND_SHARED_SECRET", "").strip()
    if not shared_secret:
        raise RuntimeError("The FastAPI chat service credentials are not configured.")

    async with httpx.AsyncClient(timeout=25.0) as client:
        response = await client.post(
            f"{base_url}/api/chat",
            json={"question": question},
            headers={"Authorization": f"Bearer {shared_secret}"},
        )
    response.raise_for_status()
    result = response.json()
    if not isinstance(result, dict):
        raise ValueError("The FastAPI chat service returned an invalid response.")
    return result


def format_assistant_reply(result: dict[str, Any]) -> str:
    answer = result.get("answer")
    if not isinstance(answer, str) or not answer.strip():
        raise ValueError("The AI assistant returned an empty response.")

    source_lines = [
        f"- {source.get('title') or 'Source'}: {source['url']}"
        for source in result.get("sources", [])
        if isinstance(source, dict) and isinstance(source.get("url"), str) and source["url"]
    ][:5]
    reply = f"{answer.strip()}\n\nSources:\n" + "\n".join(source_lines) if source_lines else answer.strip()
    return reply[:4096]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text_file(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content, encoding="utf-8")


def commit_file(path: Path, content: str, message: str) -> str:
    token = os.getenv("GITHUB_TOKEN")
    repo_name = os.getenv("GITHUB_REPO")
    if not token or not repo_name:
        raise RuntimeError("GITHUB_TOKEN and GITHUB_REPO must be set.")

    github = Github(token)
    repo = github.get_repo(repo_name)
    relative_path = path.relative_to(REPO_ROOT).as_posix()
    try:
        existing = repo.get_contents(relative_path)
        repo.update_file(
            path=relative_path,
            message=message,
            content=content,
            sha=existing.sha,
        )
    except Exception:
        repo.create_file(
            path=relative_path,
            message=message,
            content=content,
        )

    file_url = f"https://github.com/{repo_name}/blob/main/{relative_path}"
    return file_url


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_admin(update.effective_user.id if update.effective_user else None):
        await update.message.reply_text("Access denied")
        return
    text = (
        "Welcome to the Glorious Restoration Embassy CMS bot.\n\n"
        "Commands:\n"
        "/start - Welcome message\n"
        "/help - Show commands\n"
        "/upload photo - Upload a gallery image\n"
        "/blog - Create a blog markdown file\n"
        "/sermon - Create a sermon markdown file\n"
        "/event - Create an event markdown file\n"
        "/link - Create a resource link\n"
        "/status - Show bot status\n"
    )
    await update.message.reply_text(text)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_admin(update.effective_user.id if update.effective_user else None):
        await update.message.reply_text("Access denied")
        return
    await start(update, context)


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_admin(update.effective_user.id if update.effective_user else None):
        await update.message.reply_text("Access denied")
        return
    repo_name = os.getenv("GITHUB_REPO", "unknown-repo")
    await update.message.reply_text(f"Bot status: online\nRepository: {repo_name}")


async def handle_upload_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_admin(update.effective_user.id if update.effective_user else None):
        await update.message.reply_text("Access denied")
        return
    message = update.message
    if not message or not message.photo:
        await update.message.reply_text("Please send a photo to upload.")
        return
    photo = message.photo[-1]
    file = await context.bot.get_file(photo.file_id)
    file_bytes = await file.download_as_bytearray()
    target = CONTENT_ROOT / "gallery" / f"{photo.file_unique_id}.jpg"
    target.write_bytes(file_bytes)
    await update.message.reply_text(f"Photo saved: {target.name}")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (update.message.text or "").strip() if update.message else ""
    if not text:
        return

    # Preserve the existing admin-only plain-text CMS authoring format.
    if "===" not in text:
        try:
            result = await request_assistant_answer(text)
            await update.message.reply_text(format_assistant_reply(result))
        except httpx.TimeoutException:
            await update.message.reply_text(
                "The AI assistant is waking up. Please try again in 30 seconds."
            )
        except httpx.HTTPStatusError as exc:
            await update.message.reply_text(
                "The AI assistant could not answer right now. Please try again later."
            )
            print(f"FastAPI chat returned status {exc.response.status_code}.")
        except (httpx.HTTPError, RuntimeError, ValueError) as exc:
            await update.message.reply_text(
                "The AI assistant is temporarily unavailable. Please try again later."
            )
            print(f"FastAPI chat request failed: {type(exc).__name__}.")
        return

    if not is_admin(update.effective_user.id if update.effective_user else None):
        await update.message.reply_text("Access denied")
        return

    parts = [part.strip() for part in text.split("===")]
    if len(parts) < 2:
        await update.message.reply_text("Invalid format.")
        return
    title = parts[0]
    content = "===".join(parts[1:])
    slug = title.lower().replace(" ", "-")
    path = CONTENT_ROOT / "blog" / f"{slug}.md"
    write_text_file(path, content)
    try:
        sha = commit_file(path, content, f"Add blog post: {title}")
        await update.message.reply_text(f"Blog post saved. Commit: {sha}")
    except RuntimeError as exc:
        await update.message.reply_text(str(exc))


def build_application() -> Any:
    from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    app = ApplicationBuilder().token(token or "").build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("upload", handle_upload_photo))
    app.add_handler(MessageHandler(filters.PHOTO, handle_upload_photo))
    app.add_handler(CommandHandler("blog", lambda update, context: None))
    app.add_handler(CommandHandler("sermon", lambda update, context: None))
    app.add_handler(CommandHandler("event", lambda update, context: None))
    app.add_handler(CommandHandler("link", lambda update, context: None))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    return app


if __name__ == "__main__":
    app = build_application()
    app.run_polling()
