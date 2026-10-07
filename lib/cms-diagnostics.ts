let siteContentTableWarningLogged = false;

export function reportSiteContentReadError(context: string, error: { code?: string }) {
  if (error.code === "PGRST205" || error.code === "42P01") {
    if (!siteContentTableWarningLogged) {
      console.warn(
        "[cms] The site_content table is unavailable. Using fallback content; apply the Supabase editorial CMS migration.",
      );
      siteContentTableWarningLogged = true;
    }
    return;
  }

  console.error(`[cms] Could not read ${context} from Supabase.`, error);
}
