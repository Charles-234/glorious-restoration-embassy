import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  return supabase;
}

export async function saveNewsletterSubscriber(email: string) {
  return ensureSupabase().from("newsletter").insert([{ email }]);
}

export async function submitContactMessage(
  name: string,
  email: string,
  message: string,
  requestType: "prayer" | "enquiry",
) {
  return ensureSupabase()
    .from("prayer_requests")
    .insert([{
      name,
      email,
      request: message,
      is_private: true,
      request_type: requestType,
      status: "new",
      privacy_consent: true,
      privacy_consent_at: new Date().toISOString(),
      privacy_notice_version: "2026-10-07",
    }]);
}

export async function saveAIConversation(userQuestion: string, botResponse: string) {
  if (!supabase) {
    return null;
  }

  return supabase.from("ai_conversations").insert([{ user_question: userQuestion, bot_response: botResponse }]);
}

export async function fetchAIConversations(limit = 100) {
  if (!supabase) {
    return {
      data: null,
      error: new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      ),
    };
  }

  return supabase
    .from("ai_conversations")
    .select("id,user_question,bot_response,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
}
