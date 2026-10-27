import { redirect } from "next/navigation.js";

export default function AdminEventsPage() {
  redirect("/cms?kind=event");
}
