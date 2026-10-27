import { NextResponse } from "next/server.js";
import { requireAdmin } from "@/lib/admin/require-admin";
import { setPublished, updateMedia, type MediaUpdatePatch } from "@/lib/media-admin";

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const clean: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") return null;
    clean.push(entry);
  }
  return clean;
}

export async function POST(request: Request) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, patch } = body as { id?: unknown; patch?: unknown };

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "A media item id is required." }, { status: 400 });
  }
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return NextResponse.json({ error: "No changes were provided." }, { status: 400 });
  }

  const raw = patch as Record<string, unknown>;
  const cleanPatch: MediaUpdatePatch = {};

  if (raw.title !== undefined) {
    if (typeof raw.title !== "string" && raw.title !== null) {
      return NextResponse.json({ error: "Title must be text." }, { status: 400 });
    }
    cleanPatch.title = raw.title;
  }
  if (raw.caption !== undefined) {
    if (typeof raw.caption !== "string" && raw.caption !== null) {
      return NextResponse.json({ error: "Caption must be text." }, { status: 400 });
    }
    cleanPatch.caption = raw.caption;
  }
  if (raw.alt_text !== undefined) {
    if (typeof raw.alt_text !== "string" && raw.alt_text !== null) {
      return NextResponse.json({ error: "Alt text must be text." }, { status: 400 });
    }
    cleanPatch.alt_text = raw.alt_text;
  }
  if (raw.poster_src !== undefined) {
    if (typeof raw.poster_src !== "string" && raw.poster_src !== null) {
      return NextResponse.json({ error: "Poster must be text." }, { status: 400 });
    }
    cleanPatch.poster_src = raw.poster_src;
  }
  if (raw.consent_notes !== undefined) {
    if (typeof raw.consent_notes !== "string" && raw.consent_notes !== null) {
      return NextResponse.json({ error: "Consent notes must be text." }, { status: 400 });
    }
    cleanPatch.consent_notes = raw.consent_notes;
  }
  if (raw.tags !== undefined) {
    const tags = readStringArray(raw.tags);
    if (!tags) return NextResponse.json({ error: "Tags must be a list of text." }, { status: 400 });
    cleanPatch.tags = tags;
  }
  if (raw.context !== undefined) {
    const context = readStringArray(raw.context);
    if (!context) {
      return NextResponse.json({ error: "Where it appears must be a list of text." }, { status: 400 });
    }
    cleanPatch.context = context;
  }
  if (raw.sort_order !== undefined) {
    if (typeof raw.sort_order !== "number" || !Number.isFinite(raw.sort_order)) {
      return NextResponse.json({ error: "Sort order must be a number." }, { status: 400 });
    }
    cleanPatch.sort_order = Math.trunc(raw.sort_order);
  }

  const saved = await updateMedia(id, cleanPatch);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }

  if (typeof raw.published === "boolean") {
    const visibility = await setPublished(id, raw.published);
    if (!visibility.ok) {
      return NextResponse.json({ error: visibility.error }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
