import { createHash } from "crypto";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
]);

export function canonicalizeUrl(url: string): string {
  const parsed = new URL(url);

  // Lowercase hostname
  parsed.hostname = parsed.hostname.toLowerCase();

  // Strip tracking params, preserve all others
  for (const param of [...parsed.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(param.toLowerCase())) {
      parsed.searchParams.delete(param);
    }
  }

  // Remove trailing slash from pathname
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

export function generateJobKey(
  companyId: string,
  canonicalUrl: string
): string {
  return createHash("sha256").update(companyId + canonicalUrl).digest("hex");
}

/**
 * Generate a stable job key for inline jobs that don't have their own URL.
 * Uses the careers page URL + job title as the identity.
 */
export function generateInlineJobKey(
  companyId: string,
  careersUrl: string,
  title: string
): string {
  const normalized = title.trim().toLowerCase();
  return createHash("sha256")
    .update(companyId + careersUrl + "#" + normalized)
    .digest("hex");
}
