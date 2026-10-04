import { SectionHeading } from "@/components/ui/section-heading";
import { SearchWidget } from "@/components/search-widget";
import { siteConfig } from "@/lib/siteData";

export const metadata = {
  title: `Search — ${siteConfig.brandName}`,
  description: `Search sermons, ministries, branches and events across the ${siteConfig.brandName} website.`
};

export default function SearchPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Search the church experience."
          subtitle="Find sermons, ministries, branches and events in one place."
        />
      </section>

      <SearchWidget />
    </main>
  );
}
