/** Next.js minimal config */
const contentSecurityPolicy = [
  "default-src 'self';",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;",
  "style-src 'self' 'unsafe-inline';",
  "img-src 'self' data: https:;",
  "font-src 'self' data:;",
  "connect-src 'self' https://www.google-analytics.com https://*.supabase.co;",
  "media-src 'self' https://*.supabase.co;",
  "frame-ancestors 'none';",
  "base-uri 'self';",
  "form-action 'self';",
].join(" ");

export default {
  allowedDevOrigins: ["127.0.0.1", "localhost", "10.0.11.176"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "assets.mixkit.co" },
      { protocol: "https", hostname: "img.youtube.com" }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
      {
        source: "/cms",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/cms/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  }
};
