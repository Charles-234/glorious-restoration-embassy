import { NextResponse } from "next/server.js";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { src, kind, source, title, alt_text, context, tags, published, consent_notes, poster_src } = body ?? {};

    if (typeof src !== "string" || !src) return NextResponse.json({ error: "src required" }, { status: 400 });
    if (!["image", "video", "audio", "document"].includes(kind)) {
      return NextResponse.json({ error: "invalid kind" }, { status: 400 });
    }
    if (published && kind === "image" && !consent_notes?.trim?.()) {
      return NextResponse.json(
        { error: "Kenya DPA: consent basis required to publish an image." },
        { status: 409 },
      );
    }
    if (poster_src !== undefined && poster_src !== null && typeof poster_src !== "string") {
      return NextResponse.json(
        { error: "poster_src must be a string or null" },
        { status: 400 },
      );
    }
    const normalizedPosterSrc = (poster_src === undefined || poster_src === "") ? null : poster_src;
    if (normalizedPosterSrc !== null && !normalizedPosterSrc.startsWith("http")) {
      return NextResponse.json(
        { error: "poster_src must be a valid https URL or null" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("media")
      .insert({
        src,
        kind,
        source: source ?? "supabase-storage",
        title: title ?? null,
        alt_text: alt_text ?? null,
        context: Array.isArray(context) && context.length ? context : ["gallery"],
        tags: Array.isArray(tags) ? tags : [],
        published: Boolean(published),
        consent_notes: consent_notes ?? null,
        poster_src: normalizedPosterSrc,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[api/cms/media/upload] insert failed.", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("[api/cms/media/upload] failed.", error);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
