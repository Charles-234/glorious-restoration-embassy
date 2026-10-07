import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/siteData";

export const metadata = {
  title: `Privacy Policy — ${siteConfig.brandName}`,
  description: `How ${siteConfig.brandName} collects, uses and protects the information you share with us.`
};

const lastUpdated = "September 2026";

export default function PrivacyPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Privacy policy"
          subtitle="How we handle the information you share with us."
        />
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </section>

      <Card className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">What we collect</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            We only receive the information you choose to give us: your email address when you
            subscribe to the newsletter, the details you include when you contact us or request
            information, and the questions submitted through the AI chat companion.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">How it is used</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Your details are used to reply to you, to share church announcements you asked for, and
            to review and improve the answers the AI chat companion gives. AI chat questions and
            responses are stored so church leaders can review them.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">What we never do</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            We do not sell, rent or trade your information. We do not use contact messages for
            marketing, and we limit access to the church team responsible for responding.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Service providers</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            The site is hosted on Vercel. Supabase stores AI chat logs when configured, and chat
            questions are sent to our assistant service, which uses the configured Groq or Gemini
            provider to generate replies. Facebook is used for livestreaming, so watching a
            broadcast is subject to Facebook&apos;s own privacy policy. Newsletter and contact
            emails are read through our church email account.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Your choices</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            You can ask us to correct or delete any information we hold about you at any time. Email{" "}
            <a href={`mailto:${siteConfig.email}`} className="cta-link">
              {siteConfig.email}
            </a>{" "}
            or call {siteConfig.phoneDisplay} and we will action your request.
          </p>
        </div>
      </Card>
    </main>
  );
}
