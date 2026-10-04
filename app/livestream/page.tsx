import { SectionHeading } from "@/components/ui/section-heading";
import { LivestreamBanner } from "@/components/livestream-banner";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/siteData";
import { Clock, Facebook, MessageSquare } from "lucide-react";

export const metadata = {
  title: `Livestream — ${siteConfig.brandName}`,
  description:
    "Watch our Sunday services live on Facebook and follow the order of service from wherever you are."
};

export default function LivestreamPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Livestream"
          subtitle="Join our services live from wherever you are."
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          We broadcast every Sunday on Facebook Live. If you miss a service, the recording stays on
          our page so you can watch it later in the week.
        </p>
      </section>

      <LivestreamBanner />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5">
          <h2 className="text-2xl font-semibold text-foreground">Order of service</h2>
          <ul className="space-y-3">
            {siteConfig.serviceTimes.map((item) => (
              <li key={item.time} className="rounded-2xl border border-border bg-muted p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock size={16} className="text-accent" />
                  {item.time}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.label}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground sm:tracking-[0.28em]">
            All times are {siteConfig.timeZone.replace("_", " ")}
          </p>
        </Card>

        <Card className="space-y-5">
          <h2 className="text-2xl font-semibold text-foreground">Watch or talk with us</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Stream the service on Facebook, or send a WhatsApp message to share a testimony and ask
            for prayer.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={siteConfig.facebookLive}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              <Facebook size={16} /> Watch on Facebook
            </a>
            <a href={`https://wa.me/${siteConfig.whatsapp}`} className="btn btn-secondary">
              <MessageSquare size={16} /> WhatsApp us
            </a>
          </div>
        </Card>
      </section>
    </main>
  );
}
