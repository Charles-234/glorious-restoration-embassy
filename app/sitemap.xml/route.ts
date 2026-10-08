import { NextResponse } from "next/server";
import { publicRoutes } from "@/lib/public-routes";
import { siteConfig } from "@/lib/siteData";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
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
