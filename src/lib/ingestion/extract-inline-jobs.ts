import Hyperbrowser from "@hyperbrowser/sdk";
import type { JobDetail } from "./extract-details";

const client = new Hyperbrowser({
  apiKey: process.env.HYPERBROWSER_API_KEY!,
});

const INLINE_PROMPT =
  "This careers page lists job openings directly on the page without linking to separate job detail pages. Scroll to the very bottom to ensure all content is loaded. Extract every open job posting visible on this page. For each job, extract the title, department/team (if present), location (if present), salary or compensation (only if explicitly shown), and whatever description or details are available as Markdown. Do not infer missing values.";

const INLINE_SCHEMA = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          department_raw: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          salary_raw: { type: ["string", "null"] },
          description: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  required: ["jobs"],
};

export async function extractInlineJobs(
  careersUrl: string
): Promise<JobDetail[]> {
  try {
    const result = await client.extract.startAndWait({
      urls: [careersUrl],
      prompt: INLINE_PROMPT,
      schema: INLINE_SCHEMA,
    });

    if (result.status === "failed" || !result.data) {
      return [];
    }

    const data = result.data as {
      jobs?: Array<Partial<JobDetail>>;
    };

    if (!data.jobs || data.jobs.length === 0) {
      return [];
    }

    return data.jobs
      .filter((j) => j.title && j.title.trim().length > 0)
      .map((j) => ({
        title: j.title!,
        department_raw: j.department_raw ?? null,
        location: j.location ?? null,
        salary_raw: j.salary_raw ?? null,
        description: j.description ?? "",
      }));
  } catch {
    return [];
  }
}
