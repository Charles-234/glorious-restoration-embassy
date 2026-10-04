import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contact-form";
import { siteConfig, branches } from "@/lib/siteData";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";

export const metadata = {
  title: `Contact — ${siteConfig.brandName}`,
  description:
    "Send us a message, call the church office, or find the branch closest to you."
};

export default function ContactPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading title="Contact us" subtitle="We would love to hear from you." />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          Whether you need prayer, want to plan a first visit, or would like to serve on a ministry
          team, send us a message and a member of the team will get back to you.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Send us a message</h2>
          <ContactForm />
        </Card>

        <div className="space-y-6">
          <Card className="space-y-5">
            <h2 className="text-2xl font-semibold text-foreground">Church office</h2>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-3 text-foreground transition hover:text-brand-royal"
                >
                  <Mail size={18} className="shrink-0 text-accent" />
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center gap-3 text-foreground transition hover:text-brand-royal"
                >
                  <Phone size={18} className="shrink-0 text-accent" />
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  className="flex items-center gap-3 text-foreground transition hover:text-brand-royal"
                >
                  <MessageSquare size={18} className="shrink-0 text-accent" />
                  Chat with us on WhatsApp
                </a>
              </li>
            </ul>
          </Card>

          <Card className="space-y-5">
            <h2 className="text-2xl font-semibold text-foreground">Visit a branch</h2>
            <ul className="space-y-4">
              {branches.map((branch) => (
                <li key={branch.city} className="text-sm leading-7 text-muted-foreground">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <MapPin size={16} className="shrink-0 text-accent" />
                    {branch.city}
                  </span>
                  {branch.address}
                  <br />
                  {branch.phone}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </main>
  );
}
