import { redirect } from "next/navigation";

export default function AdminSermonsPage() {
  redirect("/cms?kind=sermon");
}
