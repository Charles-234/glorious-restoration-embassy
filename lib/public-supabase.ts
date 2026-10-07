import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/utils/supabase/config";

let publicClient: SupabaseClient | null = null;

export function getPublicSupabaseClient(): SupabaseClient {
  if (!publicClient) {
    const { url, publishableKey } = getSupabasePublicConfig();
    publicClient = createClient(url, publishableKey);
  }

  return publicClient;
}
