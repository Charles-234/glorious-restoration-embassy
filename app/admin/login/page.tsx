"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setLoading(false);

    if (response.ok) {
      router.push("/admin");
      return;
    }

    const result = await response.json();
    setError(result.error || "Invalid password. Please try again.");
  };

  return (
    <main className="container py-24">
      <section className="readable-surface mx-auto max-w-xl rounded-[2rem] p-10">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.32em] text-accent">Admin login</p>
          <h1 className="text-4xl font-semibold text-foreground">Protected admin console</h1>
          <p className="text-muted-foreground">Enter your admin password to view AI conversation logs and manage the site backend.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <label className="block text-sm font-semibold text-foreground">
            Admin password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
              placeholder="Enter the admin password"
            />
          </label>

          {error ? (
            <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Checking…" : "Unlock admin dashboard"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="cta-link">
            Back to homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
