import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/siteData";

// Every entry below is a real route in app/. Keeping one list (instead of two
// disagreeing domains) means the sitemap can never point at a 404 or a domain
// that differs from metadataBase.
const routes = [
  "/",
  "/about",
  "/ministries",
  "/sermons",
  "/events",
  "/gallery",
  "/livestream",
  "/branches",
  "/contact",
  "/donate",
  "/give",
  "/pastor",
  "/blog",
  "/chat",
  "/search",
  "/privacy",
  "/terms"
];

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
    .map(
      (route) =>
        `<url><loc>${siteConfig.url}${route}</loc><changefreq>weekly</changefreq><priority>0.80</priority></url>`
    )
    .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
