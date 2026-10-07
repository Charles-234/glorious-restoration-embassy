import { redirect } from "next/navigation";

export default function AdminEventsPage() {
  redirect("/cms?kind=event");
}
