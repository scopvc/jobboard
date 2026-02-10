import Hyperbrowser from "@hyperbrowser/sdk";

const client = new Hyperbrowser({
  apiKey: process.env.HYPERBROWSER_API_KEY!,
});

const LISTING_PROMPT =
  "Your task is to extract all URLs that correspond to open job postings from this page. Exclude any links that are not actual individual job postings (e.g. general info pages, general careers links, category filters, blog posts). Return each URL once. If job listings are located further down the page, make sure to scroll and find them before returning an empty list. Postings may appear under sections like 'Open Positions', 'All Jobs', 'Current Openings', 'Careers', or similar headings.";

const LISTING_SCHEMA = {
  type: "object",
  properties: {
    job_urls: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["job_urls"],
};

export async function extractListings(careersUrl: string): Promise<string[]> {
  const result = await client.extract.startAndWait({
    urls: [careersUrl],
    prompt: LISTING_PROMPT,
    schema: LISTING_SCHEMA,
  });

  if (result.status === "failed") {
    throw new Error(`Listing extraction failed: ${result.error}`);
  }

  const data = result.data as { job_urls?: string[] } | undefined;
  return data?.job_urls ?? [];
}
