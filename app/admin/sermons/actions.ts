"use server";

import { revalidatePath } from "next/cache.js";
import { redirect } from "next/navigation.js";
import { requireAdmin } from "@/lib/admin/require-admin";

type SermonValues = {
  title: string;
  speaker: string;
  date: string;
  summary: string;
  thumbnail: string | null;
  video_url: string | null;
  audio_url: string | null;
  scripture_refs: string[];
  sort_order: number;
  published: boolean;
};

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalUrl(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  if (!value) return null;

  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

function readSermonValues(formData: FormData): SermonValues | null {
  const title = readText(formData, "title");
  const speaker = readText(formData, "speaker");
  const date = readText(formData, "date");
  const summary = readText(formData, "summary");
  const sortOrderValue = readText(formData, "sort_order");
  const sortOrder = sortOrderValue ? Number(sortOrderValue) : 0;
  const thumbnail = optionalUrl(formData, "thumbnail");
  const videoUrl = optionalUrl(formData, "video_url");
  const audioUrl = optionalUrl(formData, "audio_url");

  if (
    !title ||
    !speaker ||
    !summary ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00`)) ||
    !Number.isInteger(sortOrder) ||
    !Number.isSafeInteger(sortOrder) ||
    (readText(formData, "thumbnail") && !thumbnail) ||
    (readText(formData, "video_url") && !videoUrl) ||
    (readText(formData, "audio_url") && !audioUrl)
  ) {
    return null;
  }

  const scriptureRefs = readText(formData, "scripture_refs")
    .split(/[\n,]/)
    .map((reference) => reference.trim())
    .filter(Boolean);

  return {
    title,
    speaker,
    date,
    summary,
    thumbnail,
    video_url: videoUrl,
    audio_url: audioUrl,
    scripture_refs: scriptureRefs,
    sort_order: sortOrder,
    published: formData.get("published") === "on",
  };
}

export async function saveSermon(formData: FormData) {
  const { supabase } = await requireAdmin();
  const values = readSermonValues(formData);
  if (!values) redirect("/admin/sermons?error=invalid");

  const id = readText(formData, "id");
  const result = id
    ? await supabase.from("sermons").update(values).eq("id", id)
    : await supabase.from("sermons").insert(values);

  if (result.error) {
    console.error("[admin/sermons] Could not save sermon.", result.error);
    redirect("/admin/sermons?error=save_failed");
  }

  revalidatePath("/admin/sermons");
  revalidatePath("/sermons");
  revalidatePath("/blog");
  redirect(`/admin/sermons?success=${id ? "updated" : "created"}`);
}

export async function deleteSermon(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = readText(formData, "id");
  if (!id) redirect("/admin/sermons?error=invalid");

  const { error } = await supabase.from("sermons").delete().eq("id", id);
  if (error) {
    console.error("[admin/sermons] Could not delete sermon.", error);
    redirect("/admin/sermons?error=delete_failed");
  }

  revalidatePath("/admin/sermons");
  revalidatePath("/sermons");
  revalidatePath("/blog");
  redirect("/admin/sermons?success=deleted");
}
