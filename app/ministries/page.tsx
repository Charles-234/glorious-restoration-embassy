import { SectionHeading } from "@/components/ui/section-heading";
import { MinistryGrid } from "@/components/ministry-grid";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Ministries",
  description:
    "Explore our ministries designed for worship, care, youth, and leadership training."
};

export default function MinistriesPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Our ministries"
          subtitle="We serve with intention, creativity, and spiritual depth."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          From worship gatherings to youth leadership, our ministries are designed for people who
          want to grow, belong, and restore hope.
        </p>
      </section>

      <MinistryGrid />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Worship experiences</h2>
          <p className="leading-7 text-muted-foreground">
            A premium audio-visual environment that allows worshippers to move freely between
            reverence and joyful celebration.
          </p>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Community engagement</h2>
          <p className="leading-7 text-muted-foreground">
            Regular outreach, compassionate care, and practical ministries that meet people in
            their everyday lives.
          </p>
        </Card>
      </section>

      <section className="readable-surface space-y-6 rounded-[2rem] p-8">
        <h2 className="text-3xl font-semibold text-foreground">Youth Ministry</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Creative discipleship</h3>
            <p className="leading-7 text-muted-foreground">
              A safe, joyful space where young people grow in worship, confidence, leadership, and
              biblical identity.
            </p>
          </Card>
          <Card className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Mentorship circles</h3>
            <p className="leading-7 text-muted-foreground">
              Guided conversations, prayer, and practical coaching for school, family, calling, and
              everyday life.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}