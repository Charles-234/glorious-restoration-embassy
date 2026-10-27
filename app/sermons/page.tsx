import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/lib/siteData";

export const metadata = {
  title: "Sermons",
  description: "Our sermon archive is currently being updated. Check back soon."
};

export default function SermonsPage() {
  return (
    <main className="container space-y-14 py-16 sm:py-20 lg:py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Sermons"
          subtitle="Our sermon archive is currently being updated. Check back soon."
        />
        <a
          href={siteConfig.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Watch sermons on YouTube
        </a>
      </section>
    </main>
  );
}
