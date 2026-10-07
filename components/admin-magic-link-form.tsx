"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AdminMagicLinkForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void (async () => {
        const callbackError = new URLSearchParams(window.location.search).get("error");
        if (callbackError === "access_denied") {
          setError("This account is not authorized to access the admin dashboard.");
        } else if (callbackError === "callback") {
          setError("The sign-in link could not be verified. Request a new link and try again.");
        } else if (callbackError === "verification_failed") {
          setError("We couldn't verify admin access. Please try again later.");
        }

        try {
          const supabase = createClient();
          const { data, error: userError } = await supabase.auth.getUser();

          if (userError) {
            if (userError.name !== "AuthSessionMissingError") {
              console.error("[admin-login] session check failed", userError);
            }
            return;
          }

          if (data.user) {
            router.replace("/admin");
            return;
          }
        } catch (sessionError) {
          console.error("[admin-login] Could not check the current Supabase session.", sessionError);
          setError("We couldn't verify your sign-in. Please try again.");
        } finally {
          setCheckingSession(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || checkingSession) return;

    setSending(true);
    setSent(false);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        },
      });

      if (signInError) {
        console.error("[admin-login] Could not send the Supabase magic link.", signInError);
        setError("We couldn't send the sign-in link. Check the email address and try again.");
        return;
      }

      setSent(true);
    } catch (requestError) {
      console.error("[admin-login] Magic-link request failed.", requestError);
      setError("Sign-in is temporarily unavailable. Please try again later.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <label htmlFor="admin-email" className="block text-left text-sm font-semibold text-foreground">
        Email address
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-accent focus:ring-2 focus:ring-accent/25"
          placeholder="you@example.com"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {sent && (
        <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-foreground">
          Check your email for the sign-in link
        </p>
      )}

      <button
        type="submit"
        disabled={sending || checkingSession}
        className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground shadow-[var(--shadow-warm)] transition-[transform,filter,box-shadow] duration-150 ease-out hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {checkingSession ? "Checking session…" : sending ? "Sending link…" : "Send Magic Link"}
      </button>
    </form>
  );
}
