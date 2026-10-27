import type { Metadata } from "next";
import { AdminMagicLinkForm } from "@/components/admin-magic-link-form";

export const metadata: Metadata = {
  title: "Admin Sign In — Glory Embassy",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-16 sm:py-24">
      <section className="readable-surface w-full max-w-lg rounded-[2rem] p-7 shadow-[var(--shadow-warm)] sm:p-10">
        <div className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Glory Embassy of Grace Church
          </p>
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Admin Sign In
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            Enter your authorized email address and we&apos;ll send you a secure sign-in link.
          </p>
        </div>
        <AdminMagicLinkForm />
      </section>
    </main>
  );
}
