import { redirect } from "next/navigation.js";

export default function AdminAnnouncementsPage() {
  redirect("/cms?kind=announcement");
}
