import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { bulkDelete, bulkSetPublished } from "@/lib/media-admin";

const BULK_ACTIONS = new Set(["publish", "unpublish", "delete"]);

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

  const { action, ids } = body as { action?: unknown; ids?: unknown };

  if (typeof action !== "string" || !BULK_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "Choose show on website, hide from website, or delete." },
      { status: 400 },
    );
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
    return NextResponse.json({ error: "Select at least one media item." }, { status: 400 });
  }
  if (ids.some((id) => typeof id !== "string" || !id)) {
    return NextResponse.json({ error: "Select at least one media item." }, { status: 400 });
  }

  if (action === "delete") {
    const result = await bulkDelete(ids as string[]);
    return NextResponse.json(result);
  }

  const result = await bulkSetPublished(ids as string[], action === "publish");
  return NextResponse.json(result);
}
