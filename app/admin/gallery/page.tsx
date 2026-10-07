import { redirect } from "next/navigation";

export default function AdminGalleryPage() {
  redirect("/cms?kind=gallery");
}
