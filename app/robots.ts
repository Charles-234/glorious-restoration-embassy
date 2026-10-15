import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteData";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin",
          "/api/",
          "/cms/",
          "/cms",
          "/login",
          "/auth/",
          "/search",
          "/_next/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
