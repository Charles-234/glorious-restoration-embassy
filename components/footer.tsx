"use client";

import Link from "next/link";
import { navigation, siteConfig } from "@/lib/siteData";
import { Facebook, Instagram, Youtube, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-deep text-white pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & About */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-display font-bold text-white">Glorious Restoration</span>
              <br />
              <span className="text-xs uppercase tracking-widest text-brand-gold font-semibold">Embassy</span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              A place of weightless faith, boundless grace, and immersive spiritual depth. Join us for worship, community, and spiritual growth in Kenya.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={siteConfig.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-royal transition-colors"
              >
                <Facebook size={18} />
              </a>
              {siteConfig.instagram ? (
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-royal transition-colors"
                >
                  <Instagram size={18} />
                </a>
              ) : null}
              {siteConfig.youtube ? (
                <a
                  href={siteConfig.youtube}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-royal transition-colors"
                >
                  <Youtube size={18} />
                </a>
              ) : null}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6 font-display">Quick Links</h4>
            <ul className="space-y-3">
              {navigation.slice(0, 6).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/70 hover:text-white transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-6 font-display">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/70 text-sm">
                <MapPin size={18} className="text-brand-gold shrink-0 mt-0.5" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Phone size={18} className="text-brand-gold shrink-0" />
                <a href={`tel:${siteConfig.phone}`} className="hover:text-white transition-colors">{siteConfig.phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Mail size={18} className="text-brand-gold shrink-0" />
                <a href={`mailto:${siteConfig.email}`} className="hover:text-white transition-colors">{siteConfig.email}</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-lg mb-6 font-display">Newsletter</h4>
            <p className="text-white/70 text-sm mb-4">Stay updated with our latest news and events.</p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-accent text-brand-deep font-semibold rounded-md px-4 py-2.5 text-sm transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p>© {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
