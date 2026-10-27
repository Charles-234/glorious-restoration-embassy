import Image from "next/image.js";
import Link from "next/link.js";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/siteData";

const footerGroups = [
  {
    title: "Legal & Resources",
    links: [
      ["Library", "/library"],
      ["Privacy Policy", "/privacy"],
      ["Terms of Use", "/terms"],
      ["Contact", "/contact"],
    ],
  },

  {
    title: "Explore",
    links: [
      ["Sermon Archive", "/sermons"],
      ["Church Calendar", "/events"],
      ["Photo Atmosphere", "/#atmosphere-gallery"],
      ["Branches", "/branches"],
    ],
  },
  {
    title: "Fellowship",
    links: [
      ["Our Faith & Vision", "/about"],
      ["Ministries & Groups", "/#life-at-the-embassy"],
      ["Contact us", "/contact"],
      ["M-Pesa & Giving", "/give"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="gre-footer relative z-10">
      <div className="gre-wrap">
        <div className="gre-footer-main">
          <div className="gre-footer-brand">
            <Link href="/" className="gre-footer-logo">
              <Image
                src="/stitch/glory-embassy-of-grace-official-logo.png"
                alt="Glory Embassy of Grace Church crest"
                width={68}
                height={68}
              />
              <span>Glory Embassy<small>OF GRACE CHURCH • APOSTLE STEVE KARIUKI</small></span>
            </Link>
            <p>
              A sanctuary of restoration, divine purpose, and radiant spiritual hospitality
              under the visionary apostolic leadership of Apostle Steve Kariuki.
            </p>
            <span className="gre-footer-overseer">Senior Overseer &amp; Founder</span>
            <strong className="gre-footer-pastor">Apostle Steve Kariuki</strong>
          </div>
          {footerGroups.map((group) => (
            <nav className="gre-footer-links" key={group.title} aria-label={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => (
                <Link href={href} key={href}>{label}<ArrowUpRight size={13} /></Link>
              ))}
            </nav>
          ))}
          <div className="gre-footer-online">
            <p className="gre-eyebrow">Join the service</p>
            <h2>Worship with us.</h2>
            <Link href="/livestream" className="gre-footer-watch">Watch Live <ArrowUpRight size={16} /></Link>
            <Link href="/chat" className="gre-footer-chat">AI Assistant</Link>
            <Link href={`tel:${siteConfig.phone}`} className="gre-footer-chat">
              Church enquiries · {siteConfig.phoneDisplay}
            </Link>
          </div>
        </div>
        <div className="gre-footer-bottom">
          <p>© {new Date().getFullYear()} Glory Embassy of Grace Church • Apostle Steve Kariuki. All spiritual rights reserved.</p>
          </div>
      </div>
    </footer>
  );
}
