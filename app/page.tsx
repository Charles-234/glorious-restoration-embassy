import AntigravityHero from "@/components/AntigravityHero";
import { MinistryGrid } from "@/components/ministry-grid";
import { LivestreamBanner } from "@/components/livestream-banner";
import { GalleryGrid } from "@/components/gallery-grid";
import { BranchLocator } from "@/components/branch-locator";
import { Newsletter } from "@/components/newsletter";
import { SectionHeading } from "@/components/ui/section-heading";

export default function HomePage() {
  return (
    <>
      <AntigravityHero />
      <main className="container space-y-20 py-16 lg:py-24">
        <section className="space-y-10">
          <SectionHeading title="Our ministries" subtitle="Deep-hearted care, worship, creative discipleship, and leadership training for every generation." />
          <MinistryGrid />
        </section>

        <section className="space-y-10">
          <LivestreamBanner />
        </section>

        <section className="space-y-10">
          <SectionHeading title="Gallery of grace" subtitle="Photographic stories from worship nights, outreach, and fellowship." />
          <GalleryGrid />
        </section>

        <section className="space-y-10">
          <SectionHeading title="Branch network" subtitle="Local expressions of Glorious Restoration Embassy across Africa." />
          <BranchLocator />
        </section>

        <section className="py-12">
          <Newsletter />
        </section>
      </main>
    </>
  );
}
