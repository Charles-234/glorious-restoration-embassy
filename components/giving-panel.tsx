import Link from "next/link";
import { Building2, HeartHandshake, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/siteData";

interface GivingPanelProps {
  title: string;
  description: string;
}

/**
 * Shared giving content for /give (the navbar target) and /donate.
 * Kept as a plain server component so both routes stay in sync.
 */
export function GivingPanel({ title, description }: GivingPanelProps) {
  const { label, paybill, account } = siteConfig.giveChannel;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-4">
          <Smartphone size={22} className="text-accent" />
          <h2 className="text-xl font-semibold text-foreground">{label}</h2>
          {paybill ? (
            <>
              <p className="text-sm leading-7 text-muted-foreground">
                Paybill: <span className="font-semibold text-foreground">{paybill}</span>
                <br />
                Account: <span className="font-semibold text-foreground">{account}</span>
              </p>
            </>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              Our paybill number is still being confirmed. Until it is published here, please use
              one of the other channels on this page.
            </p>
          )}
        </Card>

        <Card className="space-y-4">
          <Building2 size={22} className="text-accent" />
          <h2 className="text-xl font-semibold text-foreground">In person</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Give during any Sunday gathering — an offering basket is available at every service, and
            every branch receives tithes and offerings.
          </p>
        </Card>

        <Card className="space-y-4">
          <HeartHandshake size={22} className="text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Missions &amp; building fund</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Talk to the church office so your gift is directed to missions, outreach or the building
            fund rather than the general offering.
          </p>
        </Card>
      </div>

      <div className="readable-surface space-y-5 rounded-[2rem] p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
          Secure online giving is being updated. Please check back soon, or message the office on
          WhatsApp and we will help you give today.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`https://wa.me/${siteConfig.whatsapp}`} className="btn btn-primary">
            Give via WhatsApp
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Contact the office
          </Link>
        </div>
      </div>
    </div>
  );
}
