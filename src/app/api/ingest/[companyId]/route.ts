import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalizeUrl, generateJobKey, generateInlineJobKey } from "@/lib/ingestion/canonicalize";
import { extractListings } from "@/lib/ingestion/extract-listings";
import { extractJobDetails } from "@/lib/ingestion/extract-details";
import { extractInlineJobs } from "@/lib/ingestion/extract-inline-jobs";
import { classifyDepartment } from "@/lib/ingestion/classify-department";
import { isValidJobDetail, isValidInlineJob, isValidRun } from "@/lib/ingestion/validate";
import { cleanSalary } from "@/lib/ingestion/clean-salary";
import { cleanDescription } from "@/lib/ingestion/clean-description";
import {
  publishSnapshot,
  failSnapshot,
  type ProcessedJob,
} from "@/lib/ingestion/publish";

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  // Auth check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Load company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (!company.enabled) {
    return NextResponse.json({ error: "Company is disabled" }, { status: 404 });
  }

  if (!company.careers_url) {
    return NextResponse.json({ error: "Company has no careers URL" }, { status: 400 });
  }

  try {
    // 1. Extract listing URLs
    const rawUrls = await extractListings(company.careers_url);

    // 2. If no URLs found, try fallback: extract jobs directly from careers page
    if (rawUrls.length === 0) {
      return await handleInlineFallback(companyId, company.careers_url, company.name);
    }

    // 3. Canonicalize URLs
    const canonicalUrls = rawUrls.map((url) => canonicalizeUrl(url));

    // 4. Extract details for each URL (track URL → detail mapping)
    const results: { url: string; detail: Awaited<ReturnType<typeof extractJobDetails>> }[] = [];
    for (const url of canonicalUrls) {
      const detail = await extractJobDetails(url);
      results.push({ url, detail });
    }

    // 5. Filter valid details
    const validResults = results.filter(
      (r): r is { url: string; detail: NonNullable<typeof r.detail> } =>
        r.detail !== null && isValidJobDetail(r.detail)
    );

    // 6. Validate run
    if (!isValidRun(canonicalUrls, validResults.map((r) => r.detail))) {
      const rate = validResults.length / canonicalUrls.length;
      await failSnapshot(
        companyId,
        `Validation failed: ${validResults.length}/${canonicalUrls.length} valid (${(rate * 100).toFixed(0)}%, need 70%)`
      );
      return NextResponse.json(
        { error: "Run validation failed", validRate: rate },
        { status: 200 }
      );
    }

    // 7. Classify departments and clean descriptions
    const processedJobs: ProcessedJob[] = [];
    for (const { url, detail } of validResults) {
      const [departmentTag, description] = await Promise.all([
        classifyDepartment(detail.title, detail.department_raw, detail.description),
        cleanDescription(detail.description),
      ]);

      processedJobs.push({
        job_key: generateJobKey(companyId, url),
        title: detail.title,
        department_tag: departmentTag,
        department_raw: detail.department_raw,
        location: detail.location,
        salary_raw: cleanSalary(detail.salary_raw),
        description,
        job_url: url,
      });
    }

    // 8. Publish snapshot
    await publishSnapshot(companyId, processedJobs);

    return NextResponse.json({
      success: true,
      company: company.name,
      jobCount: processedJobs.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await failSnapshot(companyId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Fallback: extract job details directly from the careers page
 * when no individual job URLs are found.
 */
async function handleInlineFallback(
  companyId: string,
  careersUrl: string,
  companyName: string
) {
  try {
    const inlineJobs = await extractInlineJobs(careersUrl);
    const validJobs = inlineJobs.filter(isValidInlineJob);

    if (validJobs.length === 0) {
      await failSnapshot(companyId, "No job URLs found and inline fallback returned 0 jobs");
      return NextResponse.json(
        { error: "No jobs found (tried URL extraction and inline fallback)" },
        { status: 200 }
      );
    }

    const canonicalCareersUrl = canonicalizeUrl(careersUrl);
    const processedJobs: ProcessedJob[] = [];

    for (const job of validJobs) {
      const [departmentTag, description] = await Promise.all([
        classifyDepartment(job.title, job.department_raw, job.description),
        job.description ? cleanDescription(job.description) : Promise.resolve(""),
      ]);

      processedJobs.push({
        job_key: generateInlineJobKey(companyId, canonicalCareersUrl, job.title),
        title: job.title,
        department_tag: departmentTag,
        department_raw: job.department_raw,
        location: job.location,
        salary_raw: cleanSalary(job.salary_raw),
        description,
        job_url: canonicalCareersUrl,
      });
    }

    await publishSnapshot(companyId, processedJobs);

    return NextResponse.json({
      success: true,
      company: companyName,
      jobCount: processedJobs.length,
      mode: "inline_fallback",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await failSnapshot(companyId, `Inline fallback failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
