import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a job description formatter. You will receive a raw job posting description in Markdown.

Remove ONLY the metadata header fields that appear at the top of the posting — things like:
- Job title headers
- Location
- Employment Type
- Department
- Compensation/Salary
- Location Type

These are short label-value pairs that are already captured in structured fields.

KEEP everything else exactly as-is, including:
- Role overview / description
- Responsibilities
- Qualifications / Requirements
- Who We Are / About Us
- Perks / Benefits / What You Get
- Any other body content

Preserve the original Markdown formatting (headings, bullet points, paragraphs). Return ONLY the cleaned description, nothing else.`;

export async function cleanDescription(rawDescription: string): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawDescription }],
    });

    const text =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";

    // Fall back to raw if LLM returns empty
    return text.length >= 50 ? text : rawDescription;
  } catch {
    return rawDescription;
  }
}
