import Anthropic from "@anthropic-ai/sdk";
import { DEPARTMENT_TAGS, type DepartmentTag } from "../constants";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a job department classifier. Given a job title, raw department string, and job description, return exactly one department tag from this list:

${DEPARTMENT_TAGS.join(", ")}

Return ONLY the tag, nothing else.`;

export async function classifyDepartment(
  title: string,
  departmentRaw: string | null,
  description: string
): Promise<DepartmentTag> {
  const userMessage = `Job title: ${title}
Department: ${departmentRaw ?? "not specified"}
Description (first 500 chars): ${description.slice(0, 500)}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      const text =
        response.content[0].type === "text"
          ? response.content[0].text.trim()
          : "";

      const match = DEPARTMENT_TAGS.find(
        (tag) => tag.toLowerCase() === text.toLowerCase()
      );
      if (match) return match;
    } catch {
      if (attempt === 1) break;
    }
  }

  return "Other";
}
