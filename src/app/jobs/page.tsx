import { createClient } from "@/lib/supabase/server";
import { JOBS_PER_PAGE } from "@/lib/constants";
import type { LiveJob } from "@/lib/types";
import { JobCard } from "@/components/job-card";
import { JobFilters, JobSearch } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";

export const metadata = {
  title: "Portfolio Job Directory",
  description:
    "Browse open roles across our portfolio companies and find your next opportunity.",
};
// null comment
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Department can be a single string or array of strings
  const departments: string[] = Array.isArray(params.department)
    ? params.department
    : typeof params.department === "string"
      ? [params.department]
      : [];

  const selectedCompanies: string[] = Array.isArray(params.company)
    ? params.company
    : typeof params.company === "string"
      ? [params.company]
      : [];
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("live_jobs")
    .select("*", { count: "exact" })
    .order("company_name", { ascending: true })
    .order("title", { ascending: true });

  if (departments.length > 0) {
    query = query.in("department_tag", departments);
  }
  if (selectedCompanies.length > 0) {
    query = query.in("company_slug", selectedCompanies);
  }
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `title.ilike.${pattern},company_name.ilike.${pattern},location.ilike.${pattern},department_tag.ilike.${pattern}`
    );
  }

  const from = (page - 1) * JOBS_PER_PAGE;
  query = query.range(from, from + JOBS_PER_PAGE - 1);

  const { data: jobs, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / JOBS_PER_PAGE);

  // Get distinct companies for the filter dropdown
  const { data: companiesData } = await supabase
    .from("live_jobs")
    .select("company_slug, company_name");

  const companiesMap = new Map<string, string>();
  companiesData?.forEach((j) => {
    if (!companiesMap.has(j.company_slug)) {
      companiesMap.set(j.company_slug, j.company_name);
    }
  });
  const companies = Array.from(companiesMap.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Build searchParams for pagination
  const paginationParams: Record<string, string> = {};
  if (departments.length > 0) paginationParams.department = departments.join(",");
  if (selectedCompanies.length > 0) paginationParams.company = selectedCompanies.join(",");
  if (search) paginationParams.q = search;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-6 text-4xl font-light tracking-tight text-black">
        Open Positions
      </h1>
      <div className="mb-4 max-w-md">
        <JobSearch currentSearch={search} />
      </div>
      <div className="mb-6">
        <JobFilters
          currentDepartments={departments}
          currentCompanies={selectedCompanies}
          companies={companies}
        />
      </div>
      <div className="mt-8 grid gap-3">
        {(jobs as LiveJob[])?.length ? (
          (jobs as LiveJob[]).map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <p className="py-16 text-center text-sm text-gray-400">
            No jobs found matching your filters.
          </p>
        )}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/jobs"
        searchParams={paginationParams}
      />
    </div>
  );
}
