"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function getReturnPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/chat";
  }

  const destination = new URL(next, window.location.origin);
  if (destination.origin !== window.location.origin) return "/chat";

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="container py-24" aria-busy="true" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackFailed = searchParams.get("error") === "callback";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSent(false);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", getReturnPath());
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callbackUrl.toString() },
      });

      if (signInError) {
        setError("We couldn't send a sign-in link. Please check the email address and try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-24">
      <section className="readable-surface mx-auto max-w-xl rounded-[2rem] p-8 sm:p-10">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.32em] text-accent">AI assistant sign-in</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Sign in with email</h1>
          <p className="text-muted-foreground">
            Enter your email and we&apos;ll send a secure, one-time sign-in link. AI access and usage
            allowance are tied to your signed-in account.
          </p>
        </div>

        {callbackFailed && (
          <p className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            That sign-in link could not be completed. Request a new link below.
          </p>
        )}

        {sent ? (
          <p className="mt-8 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground" role="status">
            If this address can receive a sign-in link, we&apos;ve sent one. Open it in this browser
            to continue.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-foreground">
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                placeholder="you@example.com"
              />
            </label>

            {error && (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending link…" : "Email me a sign-in link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/chat" className="cta-link">
            Return to the AI assistant
          </Link>
        </p>
      </section>
    </main>
  );
}
