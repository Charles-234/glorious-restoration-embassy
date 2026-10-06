import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { SermonCard } from "@/components/sermon-card";
import { getSermons } from "@/lib/content";
import { siteConfig } from "@/lib/siteData";

export const metadata = {
  title: `Sermons — ${siteConfig.brandName}`,
  description:
    "Listen back to recent messages and catch up on the teaching series from our Sunday gatherings."
};

export default function SermonsPage() {
  const sermons = getSermons();

  return (
    <main className="container space-y-14 py-16 sm:py-20 lg:py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Sermons"
          subtitle="Messages from our Sunday gatherings, ready to revisit any day of the week."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          Every message is recorded and published here so you can keep growing in the Word, even when
          you cannot be with us in person.
        </p>
      </section>

      {sermons.length ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sermons.map((sermon) => (
            <SermonCard
              key={`${sermon.title}-${sermon.date}`}
              title={sermon.title}
              speaker={sermon.speaker}
              date={sermon.date}
              summary={sermon.summary}
              videoUrl={sermon.videoUrl}
              thumbnail={sermon.thumbnail}
            />
          ))}
        </section>
      ) : (
        <section className="readable-surface rounded-[2rem] p-8 text-center">
          <p className="text-base leading-8 text-muted-foreground">
            Our sermon library is being prepared. Please check back soon, or watch the livestream on
            Sunday.
          </p>
        </section>
      )}

      <section className="readable-surface space-y-5 rounded-[2rem] p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Never miss a message</h2>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
          Join the livestream on Sunday or send us a WhatsApp message and we will help you find a
          sermon series for your season.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/livestream" className="btn btn-primary">
            Watch live
          </Link>
          <Link href={`https://wa.me/${siteConfig.whatsapp}`} className="btn btn-secondary">
            Ask for a series
          </Link>
        </div>
      </section>
    </main>
  );
}
