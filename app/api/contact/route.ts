import { NextResponse } from "next/server";
import { submitContactMessage } from "@/lib/supabaseClient";
import { siteConfig } from "@/lib/siteData";

export async function POST(request: Request) {
  let data: {
    name?: unknown;
    email?: unknown;
    message?: unknown;
    requestType?: unknown;
    privacyConsent?: unknown;
  };
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const requestType = data.requestType === "prayer" ? "prayer" : data.requestType === "enquiry" ? "enquiry" : null;

  if (
    !name ||
    name.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 320 ||
    !message ||
    message.length > 5000 ||
    !requestType ||
    data.privacyConsent !== true
  ) {
    return NextResponse.json(
      { error: "Enter valid contact details and agree to the privacy notice." },
      { status: 400 },
    );
  }

  try {
    const { error } = await submitContactMessage(name, email, message, requestType);
    if (error) {
      console.error("[contact] Could not save the private inbox submission.", error);
      return NextResponse.json(
        { error: "Your message could not be saved. Please try again later." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[contact] The private inbox submission failed.", error);
    return NextResponse.json(
      { error: "Your message could not be saved. Please try again later." },
      { status: 500 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  let emailSent = false;

  if (!apiKey || !from || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
    console.error("[contact] Email delivery is not configured.");
  } else {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [siteConfig.email],
          reply_to: email,
          subject: requestType === "prayer" ? "New private prayer request" : "New church enquiry",
          text: [
            requestType === "prayer" ? "Private prayer request" : "Church enquiry",
            `Name: ${name}`,
            `Email: ${email}`,
            "",
            message,
          ].join("\n"),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      emailSent = response.ok;
      if (!response.ok) {
        console.error("[contact] Email provider rejected the notification.", {
          status: response.status,
        });
      }
    } catch (error) {
      console.error("[contact] Email notification request failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  return NextResponse.json({ success: true, emailSent });
}
