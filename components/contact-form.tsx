"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/siteData";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null; message?: string }>({ type: null });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }

    setStatus({ type: "loading" });
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setStatus({ type: "error", message: result.error || "Failed to send message. Please try again." });
      } else {
        setStatus({ type: "success", message: "Thank you! Your message has been received. We'll get back to you soon." });
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error. Please check your connection." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-foreground">
          Your name
          <Input
            className="mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Wanjiru"
            required
          />
        </label>
        <label className="block text-sm font-semibold text-foreground">
          Email address
          <Input
            className="mt-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-foreground">
        How can we help?
        <textarea
          className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25 resize-none"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask about service times, planning a visit, or church ministries."
          required
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" className="w-full sm:w-auto" disabled={status.type === "loading"}>
          <Send size={16} className="mr-2" /> 
          {status.type === "loading" ? "Sending..." : "Send message"}
        </Button>
        
        {/* Status message */}
        <div role="status" aria-live="polite" className="min-h-[24px]">
          {status.type === "success" && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle size={16} />
              <span>{status.message}</span>
            </div>
          )}
          {status.type === "error" && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{status.message}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Fallback notice when Supabase is not configured */}
      <p className="text-xs text-muted-foreground/60">
        Having trouble? You can also email us directly at {siteConfig.email}
      </p>
    </form>
  );
}
