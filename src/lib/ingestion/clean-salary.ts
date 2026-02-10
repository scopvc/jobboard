/**
 * Cleans raw salary text to just the numeric range.
 * Examples:
 *   "Compensation Range: $120K - $150K" → "$120K - $150K"
 *   "$160,000 - $200,000 per year" → "$160,000 - $200,000"
 *   "$120,000 - $180,000 OTE" → "$120,000 - $180,000"
 *   "$95,000" → "$95,000"
 *   "Competitive salary" → null
 */
export function cleanSalary(raw: string | null): string | null {
  if (!raw) return null;

  // Match salary ranges: $XXX,XXX - $XXX,XXX or $XXXK - $XXXK (with optional decimals)
  const rangeMatch = raw.match(
    /\$[\d,]+(?:\.\d+)?[Kk]?\s*[-–—to]+\s*\$[\d,]+(?:\.\d+)?[Kk]?/
  );
  if (rangeMatch) return rangeMatch[0];

  // Match single salary: $XXX,XXX or $XXXK
  const singleMatch = raw.match(/\$[\d,]+(?:\.\d+)?[Kk]?/);
  if (singleMatch) return singleMatch[0];

  // No recognizable salary pattern
  return null;
}
