import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/siteData";

export const metadata: Metadata = {
  title: `Terms of Use — ${siteConfig.brandName}`,
  description: `Terms for using the ${siteConfig.brandName} website and online features.`,
};

const lastUpdated = "October 7, 2026";

export default function TermsPage() {
  return (
    <main className="container space-y-12 py-20 sm:py-24">
      <section className="space-y-5 text-center">
        <SectionHeading
          title="Terms of use"
          subtitle="A few clear expectations for using our church website."
        />
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </section>

      <Card className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Using this website</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            By using this website, you agree to use it lawfully and respectfully. Do not attempt
            unauthorized access, disrupt services, introduce malicious code, misuse another
            person’s account, or collect information about visitors without permission. These rules
            support safe online interactions and are consistent with applicable laws, including
            Kenya’s Computer Misuse and Cybercrimes Act, 2018. We may limit access where needed to
            protect people, the church, or the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Messages, prayer requests, and children</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Send only information you have the right to share. Do not include another person’s
            private or sensitive information without permission. Prayer requests are accessible to
            authorized church administrators for responding; the website is not an emergency
            service, counselling service, or guaranteed confidential channel. This site is not
            directed to children under 13. A parent or guardian should supervise a child’s use and
            contact us if a child has submitted personal information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">AI assistant</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            AI responses can be inaccurate, incomplete, or unsuitable for your circumstances.
            They are general information, not pastoral care, professional advice, or a substitute
            for scripture study and trusted church leadership. Do not rely on the assistant for
            urgent decisions or share confidential, medical, financial, or identifying information.
            Questions may be processed by third-party AI providers as described in the{" "}
            <a href="/privacy" className="cta-link">Privacy Policy</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">News and third-party services</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            News cards provide short, plain-text summaries and link to the original publisher.
            Article text, photos, video, and marks remain subject to their owners’ rights and
            publisher terms. A link is not an endorsement or claim of affiliation. We do not
            guarantee third-party content, availability, or privacy practices. Opened links and
            embeds are governed by the relevant third party’s terms and privacy notice. We will
            remove or correct material when required or when a valid rights concern is brought to
            our attention.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Church content and permitted use</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Unless a page says otherwise, website design and church-created content are provided
            for personal, non-commercial viewing and sharing with attribution. Do not reproduce,
            modify, or commercially exploit material without permission from the rights holder.
            Third-party media and scripture quotations may have separate licences.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Availability and changes</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            We aim to keep the website available and accurate but do not promise uninterrupted
            service or that every page is error-free. We may change or suspend a feature for
            maintenance, safety, or operational reasons. Nothing in these terms limits rights or
            remedies that cannot lawfully be limited under applicable consumer or data-protection
            law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Privacy and contact</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Personal information is handled as described in our{" "}
            <a href="/privacy" className="cta-link">Privacy Policy</a>. Questions about these terms
            may be sent to{" "}
            <a className="cta-link" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or
            by calling {siteConfig.phoneDisplay}.
          </p>
        </section>

        <p className="border-t border-border pt-6 text-xs leading-6 text-muted-foreground">
          These terms are a plain-language starting point, not legal advice. The church should have
          them reviewed for its legal identity, operating jurisdictions, and applicable local
          consumer, privacy, copyright, and ministry requirements before deployment.
        </p>
      </Card>
    </main>
  );
}
