import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/siteData";

export const metadata = {
  title: `Terms of Service — ${siteConfig.brandName}`,
  description: `The terms that apply when you use the ${siteConfig.brandName} website and its tools.`
};

const lastUpdated = "September 2026";

export default function TermsPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Terms of service"
          subtitle="A short, plain-language summary of how this site may be used."
        />
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </section>

      <Card className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Using this website</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            You are welcome to read, share and print the material on this site for personal and
            non-commercial ministry use. Please do not present our content as your own or sell it.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Church content</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Sermon recordings, photographs, logos and written material belong to{" "}
            {siteConfig.brandName} unless stated otherwise. Photographs of identifiable people are
            published with permission; contact the office if you would like an image of you removed.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">External links and tools</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Some pages link to services we do not control, such as Facebook Live, WhatsApp and our
            payment channels. Those services have their own terms. The AI chat companion offers
            general encouragement only — it is not pastoral counselling, medical advice or a
            substitute for speaking with a church leader.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Giving</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Giving is voluntary. Always confirm the payment details shown on this site before
            sending money, and contact the office if anything looks unfamiliar.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Changes and questions</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            We may update these terms as the site changes; the date above will always show the latest
            revision. Questions? Email{" "}
            <a href={`mailto:${siteConfig.email}`} className="cta-link">
              {siteConfig.email}
            </a>
            .
          </p>
        </div>
      </Card>
    </main>
  );
}
