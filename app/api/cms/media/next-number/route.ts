import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getNextNumber } from "@/lib/media-admin";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");

    if (!kind || !["image", "video", "audio", "document"].includes(kind)) {
      return NextResponse.json({ error: "kind parameter required and must be one of: image, video, audio, document" }, { status: 400 });
    }

    const nextNumber = await getNextNumber(kind);
    return NextResponse.json({ ok: true, nextNumber });
  } catch (error) {
    console.error("[api/cms/media/next-number] failed.", error);
    return NextResponse.json({ error: "failed to get next number" }, { status: 500 });
  }
}
