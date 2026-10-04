import { SectionHeading } from "@/components/ui/section-heading";
import { BranchLocator } from "@/components/branch-locator";

export const metadata = {
  title: "Branches",
  description: "Find our church branches and connect with your local community."
};

export default function BranchesPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Our branches"
          subtitle="Local church hubs with the same spirit and welcome."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          Each branch offers worship, discipleship, and fellowship shaped for its neighborhood.
        </p>
      </section>

      <BranchLocator />
    </main>
  );
}