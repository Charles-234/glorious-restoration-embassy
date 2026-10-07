import { saveAIConversation } from "../../../lib/supabaseClient";
import {
  CHAT_CALL_LIMIT,
  createChatPostHandler,
  type ChatAuthorization,
} from "../../../lib/chat-api";
import { createClient } from "../../../utils/supabase/server";

function parseQuotaResult(data: unknown) {
  if (!Array.isArray(data) || data.length !== 1) return { status: "unavailable" as const };

  const row: unknown = data[0];
  if (typeof row !== "object" || row === null) return { status: "unavailable" as const };

  const quota = row as Record<string, unknown>;
  if (
    typeof quota.admitted !== "boolean" ||
    typeof quota.quota_used !== "number" ||
    !Number.isInteger(quota.quota_used) ||
    quota.quota_used < 0 ||
    quota.quota_used > CHAT_CALL_LIMIT ||
    typeof quota.remaining_calls !== "number" ||
    !Number.isInteger(quota.remaining_calls) ||
    quota.remaining_calls < 0 ||
    quota.remaining_calls > CHAT_CALL_LIMIT ||
    quota.quota_limit !== CHAT_CALL_LIMIT ||
    quota.remaining_calls !== CHAT_CALL_LIMIT - quota.quota_used
  ) {
    return { status: "unavailable" as const };
  }

  if (quota.admitted) {
    if (quota.quota_used < 1) return { status: "unavailable" as const };
    return {
      status: "admitted" as const,
      used: quota.quota_used,
      remaining: quota.remaining_calls,
    };
  }
  if (quota.quota_used !== CHAT_CALL_LIMIT) return { status: "unavailable" as const };
  return {
    status: "exhausted" as const,
    used: quota.quota_used,
    remaining: 0 as const,
  };
}

function getQuotaAdmissionErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "We couldn't verify your AI assistant allowance. Please try again later.";
  }

  const record = error as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  const details = typeof record.details === "string" ? record.details : "";
  const message = typeof record.message === "string" ? record.message : "";
  const combined = `${code} ${details} ${message}`.toLowerCase();

  if (
    ["PGRST205", "42P01", "42703", "42501"].includes(code) ||
    combined.includes("admit_ai_chat_call") ||
    combined.includes("ai_chat_daily_usage") ||
    combined.includes("does not exist")
  ) {
    return "The AI assistant allowance is not configured in this Supabase project. Run the chat quota migration before using the assistant.";
  }

  return "We couldn't verify your AI assistant allowance. Please try again later.";
}

async function authorize(): Promise<ChatAuthorization> {
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[chat] Supabase client could not be initialized.", error);
    return { status: "unavailable" };
  }

  let authResult;
  try {
    authResult = await supabase.auth.getUser();
  } catch (error) {
    console.error("[chat] Supabase user lookup failed.", error);
    return { status: "unavailable" };
  }

  const { data, error } = authResult;
  if (error) {
    if (
      error.name === "AuthSessionMissingError" ||
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403
    ) {
      return { status: "unauthenticated" };
    }
    console.error("[chat] Supabase user lookup returned an error.", error);
    return { status: "unavailable" };
  }
  if (!data.user) return { status: "unauthenticated" };

  return {
    status: "authenticated",
    admitCall: async () => {
      let admissionResult;
      try {
        admissionResult = await supabase.rpc("admit_ai_chat_call");
      } catch (error) {
        console.error("[chat] Supabase quota admission RPC failed.", error);
        return {
          status: "unavailable" as const,
          message: getQuotaAdmissionErrorMessage(error),
        };
      }
      if (admissionResult.error) {
        console.error("[chat] Supabase quota admission RPC returned an error.", admissionResult.error);
        return {
          status: "unavailable" as const,
          message: getQuotaAdmissionErrorMessage(admissionResult.error),
        };
      }
      return parseQuotaResult(admissionResult.data);
    },
  };
}

const handleChatPost = createChatPostHandler({
  authorize,
  getBackendUrl: () => process.env.FASTAPI_BACKEND_URL || process.env.KOYEB_BACKEND_URL,
  fetcher: fetch,
  saveConversation: saveAIConversation,
});

export async function POST(request: Request) {
  return handleChatPost(request);
}
