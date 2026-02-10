import Hyperbrowser from "@hyperbrowser/sdk";

const client = new Hyperbrowser({
  apiKey: process.env.HYPERBROWSER_API_KEY!,
});

export interface JobDetail {
  title: string;
  department_raw: string | null;
  location: string | null;
  salary_raw: string | null;
  description: string;
}

const DETAIL_PROMPT =
  "From this job posting page, extract the job title, department/team (if explicitly present), location (if present), salary or compensation (only if explicitly shown), and the full job description as Markdown preserving headings, bullet points, and paragraph structure. Do not infer missing values.";

const DETAIL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    department_raw: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    salary_raw: { type: ["string", "null"] },
    description: { type: "string" },
  },
  required: ["title", "description"],
};

export async function extractJobDetails(
  jobUrl: string
): Promise<JobDetail | null> {
  try {
    const result = await client.extract.startAndWait({
      urls: [jobUrl],
      prompt: DETAIL_PROMPT,
      schema: DETAIL_SCHEMA,
    });

    if (result.status === "failed" || !result.data) {
      return null;
    }

    const data = result.data as Partial<JobDetail>;
    if (!data.title || !data.description) {
      return null;
    }

    return {
      title: data.title,
      department_raw: data.department_raw ?? null,
      location: data.location ?? null,
      salary_raw: data.salary_raw ?? null,
      description: data.description,
    };
  } catch {
    return null;
  }
}
