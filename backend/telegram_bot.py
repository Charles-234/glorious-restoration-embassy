import json
import os
from pathlib import Path
from typing import Any

from github import Github
from telegram import Update
from telegram.ext import CommandHandler, ContextTypes, MessageHandler, filters

REPO_ROOT = Path(__file__).resolve().parent.parent
CONTENT_ROOT = REPO_ROOT / "content"
ADMINS_PATH = CONTENT_ROOT / "admins.json"


def get_admin_ids() -> set[int]:
    if not ADMINS_PATH.exists():
        return set()
    try:
        data = json.loads(ADMINS_PATH.read_text(encoding="utf-8"))
        return {int(item) for item in data.get("admins", [])}
    except (TypeError, ValueError, OSError):
        return set()


def is_admin(user_id: int | None) -> bool:
    return bool(user_id) and user_id in get_admin_ids()


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
    if not is_admin(update.effective_user.id if update.effective_user else None):
        await update.message.reply_text("Access denied")
        return
    text = (update.message.text or "").strip() if update.message else ""
    if not text:
        return
    if "===" not in text:
        await update.message.reply_text("Format should be: Title === Content")
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
    from telegram.ext import ApplicationBuilder

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
