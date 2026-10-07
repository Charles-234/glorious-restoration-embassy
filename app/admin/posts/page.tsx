import { redirect } from "next/navigation";

export default function AdminPostsPage() {
  redirect("/cms?kind=announcement");
}
