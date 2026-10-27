import { redirect } from "next/navigation.js";

export default function AdminGalleryPage() {
  redirect("/cms?kind=gallery");
}
