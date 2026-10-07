import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { SermonCard } from "@/components/sermon-card";
import { getSermons } from "@/lib/content";
import { siteConfig } from "@/lib/siteData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Sermons — ${siteConfig.brandName}`,
  description: "Sermon recordings and YouTube links will appear here when available."
};

export default async function SermonsPage() {
  const sermons = await getSermons();

  return (
    <main className="container space-y-14 py-16 sm:py-20 lg:py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Sermons"
          subtitle="Sermon recordings and YouTube links will appear here when available."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          This page will be updated as sermon recordings become available.
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
              thumbnail={sermon.thumbnail}
              videoUrl={sermon.videoUrl}
            />
          ))}
        </section>
      ) : (
        <section className="readable-surface rounded-[2rem] p-8 text-center">
          <p className="text-base leading-8 text-muted-foreground">
            There are no sermon recordings to display yet.
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
