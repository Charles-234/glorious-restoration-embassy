"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/siteData";
import { track, CHURCH_EVENTS } from "@/lib/analytics";

type RequestType = "enquiry" | "prayer";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("enquiry");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null; message?: string }>({ type: null });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim() || !privacyConsent) {
      setStatus({ type: "error", message: "Complete all fields and agree to the privacy notice." });
      return;
    }

    setStatus({ type: "loading" });
    const label = requestType === "prayer" ? "Private prayer request" : "Church enquiry";
    const whatsappText = [
      `*${label}*`,
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      message.trim(),
    ].join("\n");
    setWhatsappUrl(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(whatsappText)}`);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, requestType, privacyConsent })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setStatus({
          type: "error",
          message: `${result.error || "The message could not be saved."} You can still send it directly in WhatsApp.`,
        });
      } else {
        const successMessage = result.emailSent
          ? `Saved privately and emailed to ${siteConfig.email}.`
          : "Saved privately, but the church email notification could not be sent. Please continue in WhatsApp.";
        setStatus({
          type: "success",
          message: successMessage,
        });
        // Batch 8: analytics — type only, never the name/email/message (DPA)
        track(CHURCH_EVENTS.PRAYER_REQUEST_SUBMIT, { type: requestType });
      }
    } catch {
      setStatus({
        type: "error",
        message: "The message could not be saved. You can still send it directly in WhatsApp.",
      });
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
        Message type
        <select
          className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground"
          value={requestType}
          onChange={(event) => setRequestType(event.target.value as RequestType)}
        >
          <option value="enquiry">Church enquiry</option>
          <option value="prayer">Private prayer request</option>
        </select>
      </label>

      <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-primary"
          checked={privacyConsent}
          onChange={(event) => setPrivacyConsent(event.target.checked)}
          required
        />
        <span>
          I agree that Glorious Restoration Embassy may use these details to respond to my message
          as explained in the{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Privacy Policy
          </a>.
        </span>
      </label>

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
      
      {whatsappUrl && (
        <a
          className="btn btn-secondary inline-flex"
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
        >
          Continue to WhatsApp · {siteConfig.phoneDisplay}
        </a>
      )}

      <p className="text-xs text-muted-foreground">
        Submissions are saved for authorized church administrators. To send a copy directly, use
        the WhatsApp link after submitting and press Send in WhatsApp.
      </p>
    </form>
  );
}
