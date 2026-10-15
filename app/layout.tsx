import type { Metadata, Viewport } from "next";
import { DM_Sans, Merriweather, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "../styles.css";
import { Navbar } from "@/components/animated-navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { PublicGalleryBackground } from "@/components/public-gallery-background";
import { getPublicGalleryBackgrounds } from "@/lib/public-gallery-backgrounds";
import { siteConfig } from "@/lib/siteData";
import { CookieConsent } from "@/components/cookie-consent";
import { AnalyticsLoader } from "@/components/analytics-loader";
import { JsonLd } from "@/components/json-ld";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});
const subtitleFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-subheading",
  display: "swap"
});
const displayFont = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.brandName,
    template: `%s | ${siteConfig.brandName}`
  },
  description: siteConfig.tagline,
  metadataBase: new URL(siteConfig.url),
  // './' resolves against metadataBase, so every route emits its own canonical
  // URL. Without this Next.js renders no <link rel="canonical"> at all.
  alternates: {
    canonical: './',
  },
  keywords: ["church", "Glorious Restoration Embassy", "Kenya", "worship", "Christian", "ministry", "spiritual growth", "sermons", "events"],
  authors: [{ name: siteConfig.brandName }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.brandName,
    title: siteConfig.brandName,
    description: siteConfig.tagline,
    images: [
      {
        url: `${siteConfig.url}/social-preview.svg`,
        width: 1200,
        height: 630,
        alt: siteConfig.brandName
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.brandName,
    description: siteConfig.tagline,
    images: [`${siteConfig.url}/social-preview.svg`]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    // These must match --background in globals.css, otherwise the browser
    // chrome colour does not line up with the page on mobile.
    { media: "(prefers-color-scheme: light)", color: "#e9e4d9" },
    { media: "(prefers-color-scheme: dark)", color: "#091426" }
  ]
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const galleryBackgrounds = await getPublicGalleryBackgrounds();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${subtitleFont.variable} ${displayFont.variable} min-h-screen antialiased bg-background text-foreground font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="relative isolate min-h-screen flex flex-col">
            <PublicGalleryBackground backgrounds={galleryBackgrounds} />
            <div className="relative z-10 flex min-h-screen flex-col">
              <div className="sticky top-0 z-50">
                <div className="bg-primary text-white text-xs sm:text-sm py-2 text-center font-medium">
                  Tue 9 AM · Fri 6 PM · Sun 9 AM
                </div>
                <Navbar />
              </div>
              <PageTransition>{children}</PageTransition>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
        <CookieConsent />
        <AnalyticsLoader />
        <JsonLd />
      </body>
    </html>
  );
}
