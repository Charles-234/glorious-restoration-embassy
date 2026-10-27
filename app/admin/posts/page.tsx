import { redirect } from "next/navigation.js";

export default function AdminPostsPage() {
  redirect("/cms?kind=announcement");
}
