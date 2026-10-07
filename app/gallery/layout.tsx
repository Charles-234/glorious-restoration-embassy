import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery & Video Media Highlights",
  description: "Photos and videos from Glorious Restoration Embassy."
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
