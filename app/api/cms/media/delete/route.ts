import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { deleteMedia } from "@/lib/media-admin";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, force } = body ?? {};
    if (typeof id !== "string") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const result = await deleteMedia(id, Boolean(force));
    if (!result.ok) {
      return NextResponse.json({ error: result.error, blocked: true }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/cms/media/delete] failed.", error);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
