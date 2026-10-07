import { redirect } from "next/navigation";

export default function AdminAnnouncementsPage() {
  redirect("/cms?kind=announcement");
}
