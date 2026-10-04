import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getAnnouncements, getSermons } from "@/lib/content";
import { siteConfig } from "@/lib/siteData";

export const metadata = {
  title: `Blog — ${siteConfig.brandName}`,
  description: `News, teaching highlights and announcements from ${siteConfig.brandName}.`
};

export default function BlogPage() {
  const announcements = getAnnouncements();
  const sermons = getSermons();

  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="News and reflections"
          subtitle="Teaching highlights, ministry updates and announcements in one place."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          Longer articles are being written. In the meantime, this page gathers the latest
          announcements and message highlights from our gatherings.
        </p>
      </section>

      {announcements.length ? (
        <section className="grid gap-6 md:grid-cols-2">
          {announcements.map((item) => (
            <Card key={`${item.title}-${item.date}`} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                {item.date}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">{item.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{item.body}</p>
            </Card>
          ))}
        </section>
      ) : (
        <section className="readable-surface rounded-[2rem] p-8 text-center">
          <p className="text-base leading-8 text-muted-foreground">
            No announcements have been published yet. Weekly updates will appear here as soon as the
            church office posts them.
          </p>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Latest messages</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {sermons.slice(0, 4).map((sermon) => (
            <Card key={`${sermon.title}-${sermon.date}`} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                {sermon.date}
              </p>
              <h3 className="text-xl font-semibold text-foreground">{sermon.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{sermon.summary}</p>
              <p className="text-sm text-muted-foreground">{sermon.speaker}</p>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/sermons" className="btn btn-primary">
            Browse all sermons
          </Link>
          <Link href="/livestream" className="btn btn-secondary">
            Watch live
          </Link>
        </div>
      </section>
    </main>
  );
}
