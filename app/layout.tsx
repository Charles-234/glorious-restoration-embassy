import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/animated-navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/siteData";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

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
    { media: "(prefers-color-scheme: light)", color: "#F9F7F3" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1222" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} min-h-screen antialiased bg-background text-foreground font-sans`}>
        <Script id="netlify-identity-redirect" strategy="afterInteractive">{`
          if (window.netlifyIdentity) {
            window.netlifyIdentity.on("init", user => {
              if (!user) {
                window.netlifyIdentity.on("login", () => {
                  document.location.href = "/admin/";
                });
              }
            });
          }
        `}</Script>
        
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="relative isolate min-h-screen flex flex-col">
        <Navbar />
          <PageTransition>{children}</PageTransition>
        <Footer />
      </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
