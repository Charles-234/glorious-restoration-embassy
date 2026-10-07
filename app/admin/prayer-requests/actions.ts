"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";

const validStatuses = ["new", "contacted", "closed"] as const;
const validTypes = ["prayer", "enquiry"] as const;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isInboxId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function updatePrayerRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = readText(formData, "admin_request_id");
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const request = readText(formData, "request");
  const requestType = readText(formData, "request_type");
  const status = readText(formData, "status");

  if (
    !isInboxId(id) ||
    !name ||
    name.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 320 ||
    !request ||
    request.length > 5000 ||
    !validTypes.includes(requestType as (typeof validTypes)[number]) ||
    !validStatuses.includes(status as (typeof validStatuses)[number])
  ) {
    redirect("/admin/prayer-requests?error=invalid");
  }

  const { error } = await supabase
    .from("prayer_requests")
    .update({
      name,
      email,
      request,
      request_type: requestType,
      status,
      is_private: true,
    })
    .eq("admin_request_id", id)
    .select("admin_request_id")
    .single();

  if (error) {
    console.error("[admin/prayer-requests] Could not update the inbox item.", error);
    redirect("/admin/prayer-requests?error=update_failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/prayer-requests");
  redirect("/admin/prayer-requests?success=updated");
}

export async function deletePrayerRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = readText(formData, "admin_request_id");
  if (!isInboxId(id)) redirect("/admin/prayer-requests?error=invalid");

  const { error } = await supabase
    .from("prayer_requests")
    .delete()
    .eq("admin_request_id", id)
    .select("admin_request_id")
    .single();

  if (error) {
    console.error("[admin/prayer-requests] Could not delete the inbox item.", error);
    redirect("/admin/prayer-requests?error=delete_failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/prayer-requests");
  redirect("/admin/prayer-requests?success=deleted");
}
