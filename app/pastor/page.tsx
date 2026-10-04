import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getPastor } from "@/lib/content";
import { siteConfig } from "@/lib/siteData";
import { Mail } from "lucide-react";


export const metadata = {
  title: `Our Pastor — ${siteConfig.brandName}`,
  description: `Meet the pastor who shepherds ${siteConfig.brandName} and read the vision behind the ministry.`
};


export default function PastorPage() {
  const pastor = getPastor();

  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="Our pastor"
          subtitle="Meet the shepherd God has placed over our house."
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="readable-surface rounded-[2rem] p-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem]">
            <Image
              src={pastor.image}
              alt={pastor.name}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{pastor.name}</h2>
          {pastor.title && <p className="text-lg text-muted-foreground/80">{pastor.title}</p>}
          <p className="text-base leading-8 text-muted-foreground">{pastor.bio}</p>
          <Card className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">Ministry Vision</h3>
            <p className="text-sm leading-7 text-muted-foreground">
              Our pastor carries the vision for worship, discipleship and restoration across every
              branch — equipping families, raising leaders and keeping the church grounded in the
              Word.
            </p>
          </Card>
          {pastor.email && (
            <Card className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Contact</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                <a href={`mailto:${pastor.email}`} className="flex items-center gap-2 text-primary hover:text-accent">
                  <Mail size={16} />
                  {pastor.email}
                </a>
              </p>
            </Card>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/sermons" className="btn btn-primary">
              Listen to a message
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Contact the office
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
