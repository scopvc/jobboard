import type { JobDetail } from "./extract-details";

export function isValidJobDetail(detail: JobDetail): boolean {
  return detail.title.trim().length > 0 && detail.description.length >= 50;
}

/**
 * Relaxed validation for inline jobs extracted directly from a careers page.
 * These often have shorter descriptions or none at all.
 */
export function isValidInlineJob(detail: JobDetail): boolean {
  return detail.title.trim().length > 0;
}

export function isValidRun(
  listingUrls: string[],
  validDetails: JobDetail[]
): boolean {
  return (
    listingUrls.length >= 1 &&
    validDetails.length / listingUrls.length >= 0.7
  );
}
