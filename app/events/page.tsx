import Link from "next/link.js";
import { SectionHeading } from "@/components/ui/section-heading";
import { EventCard } from "@/components/event-card";
import { getEvents } from "@/lib/content";
import { siteConfig } from "@/lib/siteData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Events — ${siteConfig.brandName}`,
  description:
    "Celebrations, ordinations, retreats and outreach gatherings happening across our branches."
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Events"
          subtitle="Gather with us in person for the moments that shape our church family."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          From ordination services to outreach days, everything on this page is open to you, your
          family and your friends.
        </p>
      </section>

      {events.length ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={`${event.title}-${event.date}`}
              title={event.title}
              date={event.date}
              venue={event.venue}
              description={event.description}
              badge={event.badge}
              image={event.image}
            />
          ))}
        </section>
      ) : (
        <section className="readable-surface rounded-[2rem] p-8 text-center">
          <p className="text-base leading-8 text-muted-foreground">
            No events are scheduled at the moment. Follow our Sunday announcements or check the
            livestream page for what is coming next.
          </p>
        </section>
      )}

      <section className="readable-surface space-y-5 rounded-[2rem] p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Planning to join us?</h2>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
          Tell us you are coming and we will keep a seat for you — or ask us anything about the
          venue and service times.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact" className="btn btn-primary">
            Contact the office
          </Link>
          <Link href="/livestream" className="btn btn-secondary">
            Watch online instead
          </Link>
        </div>
      </section>
    </main>
  );
}
