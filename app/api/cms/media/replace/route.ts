import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { replaceMediaSrc } from "@/lib/media-admin";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, newSrc } = body ?? {};

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    if (typeof newSrc !== "string" || !newSrc.trim()) {
      return NextResponse.json({ error: "newSrc required" }, { status: 400 });
    }

    const result = await replaceMediaSrc(id, newSrc);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/cms/media/replace] failed.", error);
    return NextResponse.json({ error: "replace failed" }, { status: 500 });
  }
}
