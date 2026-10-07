import { SectionHeading } from "@/components/ui/section-heading";
import { GivingPanel } from "@/components/giving-panel";
import { getDonationInfo } from "@/lib/content";
import { siteConfig } from "@/lib/siteData";

export const dynamic = "force-dynamic";

/**
 * The navbar "Give" button points here. Before this route existed the button
 * was a dead link (HTTP 404).
 */
export const metadata = {
  title: `Give — ${siteConfig.brandName}`,
  description: `Give securely to ${siteConfig.brandName} — tithes, offerings, missions and the building fund.`
};

export default async function GivePage() {
  const donation = await getDonationInfo();

  return (
    <main className="container space-y-14 py-16 sm:py-20 lg:py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Give online"
          subtitle="Simple, transparent giving for the work of the ministry."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          Choose the channel that suits you best. If you are giving towards a specific fund, tell the
          office so we can direct your gift correctly.
        </p>
      </section>

      <GivingPanel title={donation.title} description={donation.description} />
    </main>
  );
}
