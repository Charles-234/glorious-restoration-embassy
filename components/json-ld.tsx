import { siteConfig } from "@/lib/siteData";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: siteConfig.name,
    alternateName: [siteConfig.brandName, siteConfig.brandShort],
    url: siteConfig.url,
    logo: `${siteConfig.url}/favicon.svg`,
    image: `${siteConfig.url}/social-preview.svg`,
    description: siteConfig.tagline,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Joska",
      addressRegion: "Machakos County",
      addressCountry: "KE",
    },
    sameAs: [siteConfig.youtube, siteConfig.facebook].filter(Boolean),
    location: [
      {
        "@type": "Place",
        name: `${siteConfig.brandName} — Joska (HQ)`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Joska",
          addressRegion: "Machakos County",
          addressCountry: "KE",
        },
      },
      {
        "@type": "Place",
        name: `${siteConfig.brandName} — Murang'a`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Murang'a",
          addressRegion: "Murang'a County",
          addressCountry: "KE",
        },
      },
    ],
    openingHoursSpecification: siteConfig.serviceTimes.map((service) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: service.day,
      description: service.label,
      opens: service.time,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
