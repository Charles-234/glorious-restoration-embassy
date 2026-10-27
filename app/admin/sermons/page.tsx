import { redirect } from "next/navigation.js";

export default function AdminSermonsPage() {
  redirect("/cms?kind=sermon");
}
