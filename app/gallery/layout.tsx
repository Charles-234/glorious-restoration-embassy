import type { Metadata } from "next";

/**
 * /gallery is a client component, so it cannot export metadata itself.
 * This layout supplies the page metadata and passes children through.
 *
 * IMPORTANT: never render <html> or <body> here. The root layout in
 * app/layout.tsx owns those elements — a nested <html>/<body> in a route
 * layout produces invalid HTML and breaks hydration for the whole app.
 */
export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse our gallery of worship nights, community outreach, and ministry life."
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
