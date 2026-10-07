import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/siteData";

export const metadata: Metadata = {
  title: `Privacy Policy — ${siteConfig.brandName}`,
  description: `How ${siteConfig.brandName} collects, uses, stores, and protects personal information.`,
};

const lastUpdated = "October 7, 2026";

export default function PrivacyPage() {
  return (
    <main className="container space-y-12 py-20 sm:py-24">
      <section className="space-y-5 text-center">
        <SectionHeading
          title="Privacy policy"
          subtitle="A plain-language explanation of the information shared with our church website."
        />
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </section>

      <Card className="space-y-8">
        <p className="text-sm leading-7 text-muted-foreground">
          Glorious Restoration Embassy (the “church,” “we,” or “us”) respects your privacy. This
          notice applies to this website and its contact, prayer-request, newsletter, and AI chat
          features. It is a practical notice, not a promise that online transmission or storage is
          risk-free. Please do not send passwords, payment-card data, identity documents, or details
          about another person unless you are authorized to share them.
        </p>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Information you choose to share</h2>
          <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-muted-foreground">
            <li>Contact and enquiry forms ask for your name, email address, message, and message type.</li>
            <li>Prayer requests may reveal religious beliefs or other sensitive information. Share only what you want the church to receive.</li>
            <li>Newsletter subscriptions use the email address you submit.</li>
            <li>AI chat receives the questions and responses needed to operate the assistant. Do not enter confidential pastoral, medical, financial, or identifying information.</li>
            <li>Security and hosting services may process technical information such as IP address, device/browser details, and request logs.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Why we use it and our legal basis</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            We use information to respond to enquiries and prayer requests, send a newsletter you
            requested, operate and protect the site, and provide the AI feature. We rely on your
            choice and consent where required, steps you ask us to take, our legitimate interests in
            running a church website, and legal obligations. For prayer requests and other information
            about religious beliefs, we ask for explicit consent before accepting the form and limit
            access to authorized administrators.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Who may process information</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Authorized church administrators can review inbox submissions. The site uses Supabase
            for database/authentication, its configured hosting provider, and a configured email
            delivery provider for contact notifications. AI questions are sent to the church’s
            configured assistant service and model provider. Third-party links, such as livestream
            and news publishers, operate under their own privacy notices. Provider locations and
            transfer safeguards depend on the project settings and should be confirmed with the
            provider before deployment; information may be processed outside Kenya or the country
            where you live.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Cookies, local storage, and tracking</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Authentication may use strictly necessary session cookies, and the site may store your
            display preference in your browser. This site does not intentionally use advertising
            cookies or sell/share data for cross-context behavioural advertising. Your browser
            settings let you inspect or clear cookies and site storage; clearing a sign-in cookie
            may sign you out. If non-essential analytics or tracking is added later, we will update
            this notice and provide a consent and withdrawal control before setting it where law
            requires.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Retention and security</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            We keep information only for as long as reasonably needed to respond, provide the
            requested service, meet legal obligations, resolve disputes, or protect the site. Access
            is restricted to authorized roles and technical safeguards are used, but no internet
            service can guarantee absolute security. Contact the church if you believe information
            has been accessed or used improperly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Your rights in Kenya</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Under the Kenya Data Protection Act, 2019, you may have rights to be informed, access
            and correct your personal data, object to or restrict certain processing, withdraw
            consent, and request erasure, subject to legal conditions and exceptions. You may also
            complain to the Office of the Data Protection Commissioner in Kenya. The Computer
            Misuse and Cybercrimes Act, 2018 addresses specified computer-related offences; do not
            access or interfere with accounts, systems, or data without authorization. Suspected
            cybercrime or a security incident may be reported to the relevant Kenyan authorities,
            including the appropriate law-enforcement or incident-response body.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Rights for people in the EEA/UK</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Where the General Data Protection Regulation (GDPR) or similar law applies, you may
            request access, correction, deletion, restriction, or portability, object to processing,
            and withdraw consent. You may complain to your data-protection authority. The right to
            erasure (“right to be forgotten”) is not absolute: we assess each request and may retain
            information where a lawful exception or legal obligation applies. Religious-belief data
            can be special-category data under GDPR; we request explicit consent for prayer-form
            processing and ask you not to include unnecessary sensitive details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">California and children’s privacy</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Where the California Consumer Privacy Act, as amended by the California Privacy Rights
            Act (CCPA/CPRA), applies, residents may have rights to know/access, correct, delete, and
            obtain certain information, to opt out of sale or sharing, and to receive equal service
            when exercising rights. We do not sell personal information or share it for
            cross-context behavioural advertising. Requests can be made using the contact details
            below; we will verify them as required by law. This site is not directed to children
            under 13. Consistent with the Children’s Online Privacy Protection Act (COPPA), we do
            not knowingly collect personal information online from a child under 13 without
            verifiable parental consent. A parent or guardian who believes a child submitted data
            can contact us to request review and deletion where required.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Make a privacy request</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            To ask a question, withdraw consent, or request access, correction, or deletion, email{" "}
            <a className="cta-link" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or
            call {siteConfig.phoneDisplay}. Tell us what you are requesting and how we can find the
            relevant record. We may ask for reasonable information to verify your identity. We will
            respond within the period required by the law that applies.
          </p>
        </section>

        <p className="border-t border-border pt-6 text-xs leading-6 text-muted-foreground">
          This notice is a general website privacy statement, not legal advice or a certification
          of compliance. The church should confirm its legal identity, controller contact, data
          retention schedule, provider locations, and any statutory notices with a qualified
          privacy professional before launch.
        </p>
      </Card>
    </main>
  );
}
