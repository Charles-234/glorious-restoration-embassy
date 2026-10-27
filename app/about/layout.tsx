import type { Metadata } from "next";

/**
 * /about is a client component, so it cannot export metadata itself.
 * This layout supplies the page metadata and passes children through.
 *
 * IMPORTANT: never render <html> or <body> here. The root layout in
 * app/layout.tsx owns those elements — a nested <html>/<body> in a route
 * layout produces invalid HTML and breaks hydration for the whole app.
 */
export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about the mission, vision, and spiritual heartbeat of Glory Embassy of Grace Church."
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
