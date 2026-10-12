import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listAllMedia } from "@/lib/media-admin";

export async function GET() {
  await requireAdmin();

  try {
    const rows = await listAllMedia();
    return NextResponse.json(rows);
  } catch (error) {
    console.error("[cms/media/list] Could not list media.", error);
    return NextResponse.json(
      { error: "The media library could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}
