"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GalleryBackground } from "@/components/gallery-background";
import { LocalMediaGallery } from "@/components/local-media-gallery";
import { MpesaLogo } from "@/components/mpesa-logo";
import PastorPortraitCarousel from "@/components/pastor-portrait-carousel";
import { AIChatbot } from "@/components/ai-chatbot";
import type { HeroContent } from "@/lib/content";
import type { GalleryMediaItem } from "@/lib/local-gallery";
import { branches, siteConfig } from "@/lib/siteData";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  HeartHandshake,
  MapPin,
  MessageCircleQuestion,
  Play,
  Radio,
  Sun,
  UsersRound,
  X,
} from "lucide-react";

const photos = [
  {
    src: "/stitch/ordination-consecration-prayer-with-bishops-in-p.jpg",
    alt: "Ordination consecration prayer with bishops in purple",
    title: "Decree of Apostle Ordination",
  },
  {
    src: "/stitch/pastor-1.jpg",
    alt: "Apostle Steve Kariuki reading official decree",
    title: "Apostle Steve Kariuki",
  },
  {
    src: "/stitch/pastor-2.jpg",
    alt: "Apostle Steve Kariuki with family and youth on sanctuary stage",
    title: "Family Stage",
  },
  {
    src: "/stitch/pastor-3.jpg",
    alt: "Apostle Steve Kariuki speaking with microphone under drapery",
    title: "Apostle Preaching",
  },
  {
    src: "/stitch/pastor-4.jpg",
    alt: "Apostle Steve Kariuki in white suit and purple vestment",
    title: "Consecration",
  },
  {
    src: "/stitch/pastor-10.jpg",
    alt: "Apostle Steve Kariuki greeting presiding bishops and elders",
    title: "Atmosphere Gallery",
  },
];

const serviceIcons = [Sun, UsersRound, CalendarDays, CalendarDays];

const ministries = [
  {
    image: "/stitch/restoration-kids-nursery.jpg",
    imageAlt: "Restoration Kids & Nursery",
    eyebrow: "Ages 2 - 13",
    title: "Restoration Kids",
    description:
      "Fun, secure, Bible-centered learning where children learn scripture memorization and creative praise.",
    link: "View Curriculum",
  },
  {
    image: "/stitch/restoration-youth-force.jpg",
    imageAlt: "Restoration Youth Force",
    eyebrow: "Teens",
    title: "Restoration Youth Force",
    description:
      "Empowering young minds with kingdom identity, branch evangelism, creative arts, and peer mentorship.",
    link: "Youth Gatherings",
  },
  {
    image: "/stitch/women-of-grace-fellowship.jpg",
    imageAlt: "Women of Grace Fellowship",
    eyebrow: "Women's Fellowship",
    title: "Women of Grace & Honor",
    description:
      "Under Rev. Mama Kariuki, nurturing godly homes, entrepreneurial skills, mothers' prayer watches, and charity.",
    link: "Monthly Breakfasts",
  },
  {
    image: "/stitch/men-of-valor-purpose.jpg",
    imageAlt: "Men of Valor & Purpose",
    eyebrow: "Men's Alliance",
    title: "Men of Valor & Purpose",
    description:
      "Mobilizing priests of homes, marketplace leaders, and brothers in accountability through retreats and discipleship.",
    link: "Men's Summit",
  },
];

function YouTubeMark({ size = 21 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable="false"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.376-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function MpesaMark({ className = "" }: { className?: string }) {
  return (
    <span className={`gre-mpesa-icon ${className}`.trim()}>
      <MpesaLogo small />
    </span>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="gre-section-intro">
      <p className="gre-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="gre-section-description">{description}</p>}
    </div>
  );
}

export function StitchHomepage({
  mediaItems,
  heroContent,
}: {
  mediaItems: GalleryMediaItem[];
  heroContent: HeroContent;
}) {
  const [copied, setCopied] = useState<"paybill" | "account" | null>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const liveDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyValue(value: string, kind: "paybill" | "account") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="gre-home">
      <main>
        <section id="heroSection" className="gre-hero" aria-labelledby="home-title">
          <div className="gre-wrap gre-hero-grid">
            <div className="gre-hero-copy">
              <p className="gre-eyebrow">Welcome to Glorious Restoration Embassy</p>
              <h1 id="home-title">{heroContent.title}</h1>
              <p className="gre-hero-lead">{heroContent.subtitle}</p>
              <div className="gre-hero-actions">
                <button
                  type="button"
                  className="gre-button gre-button-primary"
                  onClick={() => liveDialog.current?.showModal()}
                >
                  <Play size={17} fill="currentColor" />                   {heroContent.ctaPrimary}
                </button>
                <Link href="/contact#visit-planner" className="gre-button gre-button-outline">
                  <CalendarDays size={17} /> {heroContent.ctaSecondary}
                </Link>
              </div>
              <Link href="/sermons" className="gre-text-link">
                Watch Channel Sermons <ArrowRight size={17} />
              </Link>
            </div>

            <div className="gre-hero-visual">
              <div className="gre-overseer-card">
                <div className="gre-overseer-feature">
                  <PastorPortraitCarousel
                    className="gre-overseer-carousel"
                    ariaLabel="Apostle Steve Kariuki portraits"
                    intervalMs={6500}
                    slides={[
                      {
                        src: "/stitch/pastor-3.jpg",
                        alt: "Apostle Steve Kariuki speaking with a microphone under sanctuary drapery",
                        caption: "Apostolic Preaching",
                      },
                      {
                        src: "/stitch/pastor-4.jpg",
                        alt: "Apostle Steve Kariuki in a white suit and purple vestment",
                        caption: "Consecration",
                      },
                      {
                        src: "/stitch/pastor-10.jpg",
                        alt: "Apostle Steve Kariuki greeting presiding bishops and elders",
                        caption: "Presbytery & Council",
                      },
                    ]}
                  />
                  <div className="gre-overseer-overlay">
                    <p className="gre-card-kicker">Spiritual Overseer</p>
                    <h2>Apostle Steve Kariuki</h2>
                    <p className="gre-overseer-quote">
                      “Restoration is not an event, it is the heartbeat of God&apos;s redemptive
                      grace for your household.”
                    </p>
                  </div>
                </div>
              </div>
              <a className="gre-gallery-peek" href="#atmosphere-gallery">
                <span className="gre-gallery-peek-title">Atmosphere Gallery</span>
                <span>Apostle Preaching · Consecration · Family Stage</span>
                <ArrowDown size={17} />
              </a>
            </div>
          </div>
          <span className="gre-hero-watermark" aria-hidden="true">GRE</span>
        </section>

        <section className="gre-live gre-section">
          <div className="gre-wrap">
            <div className="gre-live-panel">
              <div className="gre-live-icon"><Radio size={22} /></div>
              <div className="gre-live-copy">
                <span className="gre-live-label"><i /> Next Live Broadcast</span>
                <h2>Sunday Celebration Service with Apostle Steve Kariuki</h2>
              </div>
              <button type="button" className="gre-button gre-button-light" onClick={() => liveDialog.current?.showModal()}>
                Watch Live <ArrowRight size={17} />
              </button>
              <Link className="gre-live-schedule" href="#fellowship-schedule">View Weekly Routine <ArrowDown size={16} /></Link>
            </div>
          </div>
        </section>

        <section className="gre-gatherings gre-section" id="fellowship-schedule">
          <div className="gre-wrap">
            <SectionIntro
              eyebrow="Atmosphere of Grace"
              title="Times of Gathering & Fellowship"
              description="We believe in deliberate community, heart-felt worship, and tangible transformation through the Holy Spirit."
            />
            <div className="gre-service-grid">
              {siteConfig.serviceTimes.map((service, index) => {
                const Icon = serviceIcons[index];
                return (
                  <article className="gre-service-card" key={`${service.day}-${service.label}`}>
                    <div className="gre-service-card-head">
                      <span className="gre-icon-disc"><Icon size={21} /></span>
                      <span className="gre-pill">
                        {service.day}
                      </span>
                    </div>
                    <h3>{service.label}</h3>
                    <div className="gre-service-meta">
                      <Clock3 size={16} />
                      <span>{service.day} · {service.time}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="gre-sermons gre-section" id="sermons-archive">
          <div className="gre-wrap gre-sermons-layout">
            <div className="gre-sermons-copy">
              <p className="gre-eyebrow">YouTube Official Broadcast</p>
              <h2>Watch Sermons Online</h2>
              <p>
                Access live worship broadcasts, apostolic revelations, and archive messages on
                our official YouTube ministry stream.
              </p>
              <a
                className="gre-button gre-button-youtube"
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
              >
                <YouTubeMark /> Subscribe on YouTube
              </a>
            </div>
            <div className="gre-channel-card">
              <div className="gre-channel-top">
                <span className="gre-channel-mark"><YouTubeMark size={28} /></span>
                <span className="gre-channel-badge"><i /> OFFICIAL YOUTUBE CHANNEL</span>
              </div>
              <h3>Glorious Restoration Embassy Official Channel</h3>
              <p>Live &amp; Recorded Preachings will sync here</p>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                <YouTubeMark size={18} /> Subscribe on YouTube <ArrowRight size={17} />
              </a>
              <small>Channel auto-sync configured for upcoming live streams &amp; Sunday archives.</small>
            </div>
          </div>
        </section>

        <section className="gre-giving gre-section" id="giving-module">
          <div className="gre-wrap gre-giving-layout">
            <div className="gre-giving-copy">
              <p className="gre-eyebrow">Kingdom Stewardship</p>
              <h2>Support the Kingdom Work &amp; Outreach</h2>
              <p>
                Every seed sown advances community restoration, expands our church branches,
                feeds vulnerable families, and brings the light of the gospel to the nations.
              </p>
              <div className="gre-giving-assurances">
                <div>
                  <span className="gre-assurance-icon"><HeartHandshake size={19} /></span>
                  <p><strong>100% Transparent Stewardship:</strong> All tithes and building donations are audited quarterly under pastoral accountability.</p>
                </div>
                <div>
                  <span className="gre-assurance-icon"><UsersRound size={19} /></span>
                  <p><strong>Humanitarian Reach:</strong> Dedicated funds provide school sponsorships and emergency food bags to vulnerable families.</p>
                </div>
              </div>
            </div>
            <div className="gre-mpesa-card">
              <div className="gre-mpesa-heading">
                <span className="gre-mpesa-icon"><MpesaMark /></span>
                <span>
                  <strong>Direct M-Pesa Giving</strong>
                  <small>Instant mobile deposit (Kenya &amp; East Africa)</small>
                </span>
              </div>
              <span className="gre-official-label">Official</span>
              <div className="gre-pay-value">
                <span>Business / Paybill:</span><strong>247247</strong>
                <button type="button" onClick={() => void copyValue("247247", "paybill")} aria-label="Copy Paybill">
                  {copied === "paybill" ? <Check size={17} /> : <Copy size={17} />}
                  {copied === "paybill" ? "Copied" : "Copy Paybill"}
                </button>
              </div>
              <div className="gre-pay-value">
                <span>Account Number:</span><strong>{siteConfig.giveChannel.account}</strong>
                <button type="button" onClick={() => void copyValue(siteConfig.giveChannel.account, "account")} aria-label="Copy account number">
                  {copied === "account" ? <Check size={17} /> : <Copy size={17} />}
                  {copied === "account" ? "Copied" : "Copy Account"}
                </button>
              </div>
              <p className="gre-pay-account-name">{siteConfig.giveChannel.accountName}</p>
            </div>
          </div>
        </section>

        <section className="gre-life gre-section" id="life-at-the-embassy">
          <div className="gre-wrap">
            <SectionIntro
              eyebrow="Connect · Grow · Serve"
              title="Life at the Embassy"
              description="There is an intentional space for every generation to experience discipleship and purposeful impact."
            />
            <div className="gre-ministry-grid">
              {ministries.map((ministry) => (
                <article className="gre-ministry-card" key={ministry.title}>
                  <div className="gre-ministry-image">
                    <Image src={ministry.image} alt={ministry.imageAlt} fill sizes="(max-width: 760px) 100vw, 25vw" />
                  </div>
                  <div className="gre-ministry-content">
                    <p className="gre-card-kicker">{ministry.eyebrow}</p>
                    <h3>{ministry.title}</h3>
                    <p>{ministry.description}</p>
                    <Link href="/events">{ministry.link}<ChevronRight size={15} /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="gre-advisory gre-section" id="visit-planner">
          <div className="gre-wrap">
            <div className="gre-advisory-card">
              <div className="gre-advisory-symbol"><MessageCircleQuestion size={26} /></div>
              <div className="gre-advisory-copy">
                <p className="gre-eyebrow">Connect with the Embassy</p>
                <h2>Have a question about the Embassy?</h2>
                <p>
                  The website chat and Telegram bot are separate channels to the same AI assistant
                  and knowledge base.
                </p>
              </div>
              <div className="gre-advisory-actions">
                <Link className="gre-button gre-button-primary" href="#website-assistant">
                  <MessageCircleQuestion size={17} /> Ask AI Assistant
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="gre-branches gre-section" id="branches">
          <div className="gre-wrap">
            <div className="gre-branch-heading">
              <SectionIntro
                eyebrow="Global Footprint"
                title="Headquarters"
                description="Visit Glorious Restoration Embassy in Joska, Machakos County."
              />
              <Link href="/branches" className="gre-text-link">View location <ArrowRight size={17} /></Link>
            </div>
            <div className="gre-branch-grid">
              {branches.map((branch) => (
                <article
                  className={`gre-branch-card${branch.kind === "Headquarters" ? " gre-branch-main" : ""}`}
                  key={branch.city}
                >
                  <span className="gre-branch-label"><MapPin size={15} /> {branch.kind}</span>
                  <h3>{branch.city}</h3>
                  <p>{branch.address}</p>
                  {branch.coordinates && <p>{branch.coordinates}</p>}
                  {branch.mapsUrl && (
                    <a href={branch.mapsUrl} target="_blank" rel="noreferrer" className="gre-branch-map-link">
                      View on Google Maps
                    </a>
                  )}
                  {branch.kind === "Headquarters" && (
                    <span className="gre-branch-pastor">Apostle Steve Kariuki</span>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="gre-gallery gre-section" id="atmosphere-gallery">
          <div className="gre-wrap">
            <SectionIntro
              eyebrow="Media Center"
              title="Gallery & Video Media Highlights"
              description="Photos and videos from Glorious Restoration Embassy."
            />
            <LocalMediaGallery items={mediaItems} limit={8} />
            <Link href="/gallery" className="gre-gallery-all-link">View all media <ArrowRight size={17} /></Link>
          </div>
        </section>

        <section className="gre-section" id="website-assistant" aria-label="Website AI assistant">
          <div className="gre-wrap">
            <AIChatbot />
          </div>
        </section>

      </main>

      <dialog
        ref={liveDialog}
        className="gre-live-dialog"
        aria-labelledby="live-dialog-title"
        onClick={(event) => {
          if (event.target === liveDialog.current) liveDialog.current?.close();
        }}
      >
        <div className="gre-live-dialog-inner">
          <button className="gre-dialog-close" type="button" onClick={() => liveDialog.current?.close()} aria-label="Close live stream">
            <X size={21} />
          </button>
          <span className="gre-live-label"><i /> Glorious Restoration Embassy • Live Stream</span>
          <span className="gre-dialog-icon"><Radio size={29} /></span>
          <p className="gre-eyebrow">Live Sanctuary Broadcast Feed</p>
          <h2 id="live-dialog-title">Live Sanctuary Broadcast Feed</h2>
          <p>
            Our live broadcast starts 15 minutes before scheduled service times. Presided by
            Apostle Steve Kariuki.
          </p>
          <a className="gre-button gre-button-youtube" href="https://youtube.com" target="_blank" rel="noreferrer">
            <YouTubeMark /> Open on YouTube Live
          </a>
          <div className="gre-audio-choice">
            <span>Audio Only Mode Available for low bandwidth connections.</span>
            <button type="button" aria-pressed={audioOnly} onClick={() => setAudioOnly((active) => !active)}>
              {audioOnly ? "Audio Only Mode Selected" : "Switch to Low-Data Audio"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
