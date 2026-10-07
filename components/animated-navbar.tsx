"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useHydrated } from "@wrksz/themes/client/use-hydrated";
import { useTheme } from "@wrksz/themes/client/use-theme";
import { Menu, Moon, Sun, X } from "lucide-react";
import { MpesaLogo } from "@/components/mpesa-logo";
import { siteConfig } from "@/lib/siteData";

const navigation = [
  { label: "About", href: "/about" },
  { label: "Sermons", href: "/sermons" },
  { label: "News", href: "/news" },
  { label: "Gallery", href: "/gallery" },
  { label: "Gatherings", href: "/events" },
  { label: "M-Pesa Giving", href: "/give" },
  { label: "Branches", href: "/branches" },
  { label: "Visit", href: "/contact" },
];

function MpesaWordmark({ small = false }: { small?: boolean }) {
  return <MpesaLogo small={small} />;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mounted = useHydrated();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`gre-header${scrolled ? " is-scrolled" : ""}`}
    >
      <div className="gre-announcement">
        <div className="gre-wrap gre-announcement-inner">
          <p className="gre-service-note">
            <span aria-hidden="true">◷</span>
            Sunday Services: {siteConfig.serviceTimes[0].time} {siteConfig.serviceTimes[0].label} · {siteConfig.serviceTimes[1].time} {siteConfig.serviceTimes[1].label}
          </p>
          <div className="gre-announcement-links">
            <Link href="/give" className="gre-paybill-top">
              <MpesaWordmark small /> Paybill: 247247
            </Link>
            <Link href="/livestream">Watch Live</Link>
            <a href={`tel:${siteConfig.phone}`}>
              Church Enquiries · {siteConfig.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="gre-wrap gre-nav-row">
        <Link href="/" className="gre-brand" aria-label="Glorious Restoration Embassy home">
          <Image
            src="/stitch/glorious-restoration-embassy-official-logo.png"
            alt="Glorious Restoration Embassy crest"
            width={58}
            height={58}
            priority
            className="gre-crest"
          />
          <span className="gre-brand-copy">
            <span className="gre-brand-name">Glorious Restoration</span>
            <span className="gre-brand-tag">EMBASSY • APOSTLE STEVE KARIUKI</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="gre-desktop-nav">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="gre-nav-actions">
          {mounted && (
            <button
              type="button"
              className="gre-theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light" : "Dark"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          )}
          <Link href="/give" className="gre-give-button">
            <MpesaWordmark small /> Give
          </Link>
          <button
            type="button"
            className="gre-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="gre-mobile-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="gre-mobile-navigation" aria-label="Mobile navigation" className="gre-mobile-nav">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/give" className="gre-mobile-give" onClick={() => setMenuOpen(false)}>
            <MpesaWordmark small /> Give • M-Pesa
          </Link>
        </nav>
      )}
    </motion.header>
  );
}
