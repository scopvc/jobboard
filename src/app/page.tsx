import { createClient } from "@/lib/supabase/server";
import { JOBS_PER_PAGE } from "@/lib/constants";
import type { LiveJob } from "@/lib/types";
import { JobCard } from "@/components/job-card";
import { JobFilters, JobSearch } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";
import { DotField } from "@/components/dot-field";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const departments: string[] = Array.isArray(params.department)
    ? params.department
    : typeof params.department === "string"
      ? [params.department]
      : [];

  const company =
    typeof params.company === "string" ? params.company : null;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();

  // Stats for hero
  const { count: totalJobs } = await supabase
    .from("live_jobs")
    .select("*", { count: "exact", head: true });

  const { count: totalCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });

  // Build job listing query
  let query = supabase
    .from("live_jobs")
    .select("*", { count: "exact" })
    .order("first_seen_at", { ascending: false })
    .order("company_name", { ascending: true })
    .order("title", { ascending: true });

  if (departments.length > 0) {
    query = query.in("department_tag", departments);
  }
  if (company) {
    query = query.eq("company_slug", company);
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

  const paginationParams: Record<string, string> = {};
  if (departments.length > 0) paginationParams.department = departments.join(",");
  if (company) paginationParams.company = company;
  if (search) paginationParams.q = search;

  return (
    <>
      {/* Hero section */}
      <section className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden -mt-8">
        <div className="grid w-full grid-cols-1 md:grid-cols-2">
          {/* Text — left half, padded to align with header logo */}
          <div className="flex flex-col justify-center px-10 py-16 md:py-0 md:pl-36 md:pr-12">
            <h1 className="text-3xl font-light tracking-tight text-black sm:text-5xl lg:text-6xl xl:text-[5.5rem]">
              Opportunities<br />
              at ScOp Portfolio<br />
              Companies
            </h1>
            <p className="mt-4 text-lg text-gray-500 sm:mt-6 sm:text-xl lg:text-2xl">
              Find roles at leading software and AI companies.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <p className="text-base tracking-wide text-gray-400">
                {totalCompanies ?? 0} Companies &middot; {totalJobs ?? 0} Open Roles
              </p>
              <a
                href="#jobs"
                className="animate-bounce"
                aria-label="Scroll to job listings"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400 transition-colors duration-150 hover:text-black"
                >
                  <path
                    d="M12 5v14m0 0l-6-6m6 6l6-6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
          {/* Dot field — right half, trimmed from bottom and right */}
          <div className="hidden h-[min(42rem,74vh)] md:block">
            <DotField />
          </div>
        </div>
      </section>

      {/* Job listings */}
      <section id="jobs" className="px-6 py-10 sm:px-10 md:px-36">
        <h2 className="mb-6 text-4xl font-light tracking-tight text-black">
          Open Positions
        </h2>
        <div className="mb-4 max-w-md">
          <JobSearch currentSearch={search} basePath="/" />
        </div>
        <div className="mb-6">
          <JobFilters
            currentDepartments={departments}
            currentCompany={company}
            currentSearch={search}
            companies={companies}
            basePath="/"
          />
        </div>
        <div className="mt-8">
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
          basePath="/"
          searchParams={paginationParams}
        />
      </section>
    </>
  );
}
