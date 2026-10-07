import { SectionHeading } from "@/components/ui/section-heading";
import { GivingPanel } from "@/components/giving-panel";
import { getDonationInfo } from "@/lib/content";
import { siteConfig } from "@/lib/siteData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Donations — ${siteConfig.brandName}`,
  description: `Give with purpose — tithes, offerings, missions and our building fund at ${siteConfig.brandName}.`
};

export default async function DonatePage() {
  const donation = await getDonationInfo();

  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Give with purpose"
          subtitle="Every gift supports worship, discipleship and outreach across our branches."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          Thank you for partnering with us. Giving is an act of worship, and each contribution is
          used with care and accountability.
        </p>
      </section>

      <GivingPanel title={donation.title} description={donation.description} />
    </main>
  );
}
