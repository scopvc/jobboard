# Portfolio Job Directory — Implementation Phases

> This document breaks the build into 6 sequential phases. Each phase is independently verifiable. Steps labeled **[USER]** require manual action (account creation, config, etc.). Steps labeled **[CODE]** are implementation tasks for the AI coding assistant.
>
> **Prerequisite:** Read `PRD.md` in this repo before starting any phase.

---

## Phase Dependency Graph

```
Phase 1 ──→ Phase 2 ──→ Phase 4 ──→ Phase 6
   │                                    ↑
   └──────→ Phase 3 ──→ Phase 5 ───────┘
```

Phases 2 and 3 can run in parallel after Phase 1 is complete. Phase 3 uses seed data, so it does not depend on ingestion.

---

## Phase 1: Project Scaffolding & Data Layer

### Goal
Stand up the Next.js project, database schema, seed data, and Supabase client utilities. After this phase, `npm run dev` works and seed data is queryable.

### Steps

1. **[CODE]** Initialize a Next.js project in this directory with:
   - App Router
   - TypeScript
   - Tailwind CSS
   - ESLint

2. **[USER]** Create a Supabase project:
   - Go to [supabase.com](https://supabase.com) and create a new project.
   - Note the **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`) and **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) from Project Settings → API.
   - Note the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) from the same page (keep secret).
   - Generate a random string for `CRON_SECRET` (used to authenticate cron/ingestion requests). You can use: `openssl rand -hex 32`.

3. **[CODE]** Install Supabase packages:
   ```
   npm install @supabase/supabase-js @supabase/ssr
   ```

4. **[CODE]** Create environment files:

   **`.env.example`** (committed to repo):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   CRON_SECRET=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   **`.env.local`** (gitignored, created by user):
   - Copy `.env.example` and fill in values from step 2.

5. **[CODE]** Create SQL migration file at `supabase/migrations/001_initial_schema.sql`:

   **Tables:**

   - **`companies`** — `id` (uuid, PK, default gen_random_uuid()), `name` (text, not null), `slug` (text, unique, not null), `careers_url` (text, not null), `enabled` (boolean, default true), `created_at` (timestamptz, default now())

   - **`snapshots`** — `id` (uuid, PK, default gen_random_uuid()), `company_id` (uuid, FK → companies, not null), `status` (text, not null, check in 'pending','published','failed'), `job_count` (integer, default 0), `error_message` (text, nullable), `created_at` (timestamptz, default now())

   - **`jobs`** — `id` (uuid, PK, default gen_random_uuid()), `job_key` (text, not null), `snapshot_id` (uuid, FK → snapshots, not null), `company_id` (uuid, FK → companies, not null), `title` (text, not null), `department_tag` (text, not null), `department_raw` (text, nullable), `location` (text, nullable), `salary_raw` (text, nullable), `description` (text, not null), `job_url` (text, not null), `first_seen_at` (timestamptz, not null), `created_at` (timestamptz, default now())

   - **`clicks`** — `id` (uuid, PK, default gen_random_uuid()), `job_key` (text, not null), `company_id` (uuid, FK → companies, not null), `clicked_at` (timestamptz, default now())

   **Indexes:**
   - `jobs.job_key` (for lookups)
   - `jobs.snapshot_id` (for joins)
   - `jobs.company_id` (for filtering)
   - `snapshots.company_id` + `snapshots.status` (for finding latest published snapshot)
   - `clicks.job_key` (for analytics)
   - `clicks.company_id` (for analytics)

   **View — `live_jobs`:**
   Returns all jobs belonging to the latest published snapshot per company (where the company is enabled). This is the only view the public directory queries.

   ```sql
   CREATE VIEW live_jobs AS
   SELECT j.*,
          c.name AS company_name,
          c.slug AS company_slug
   FROM jobs j
   JOIN snapshots s ON s.id = j.snapshot_id
   JOIN companies c ON c.id = j.company_id
   WHERE c.enabled = true
     AND s.status = 'published'
     AND s.id = (
       SELECT s2.id FROM snapshots s2
       WHERE s2.company_id = c.id AND s2.status = 'published'
       ORDER BY s2.created_at DESC
       LIMIT 1
     );
   ```

   **Important:** Run this migration in the Supabase SQL Editor (Dashboard → SQL Editor → paste and run).

6. **[CODE]** Create seed data file at `supabase/seed.sql`:
   - 3 companies with distinct slugs (e.g., `acme-corp`, `globex`, `initech`)
   - 1 published snapshot per company
   - ~10 jobs total spread across multiple departments (Engineering, Sales, Design, Marketing, Data, Operations) so the UI can be built with realistic filtering
   - Each job should have a plausible title, description (at least a paragraph of Markdown), a `first_seen_at` spread over a few days, and a `job_url` pointing to `https://example.com/jobs/...`
   - Include at least 2 jobs with location and salary_raw values, and at least 2 with nulls, to test conditional rendering

   **Important:** Run this seed file in the Supabase SQL Editor after the migration.

7. **[CODE]** Create Supabase client utilities:

   - **`src/lib/supabase/browser.ts`** — Creates a Supabase client for use in Client Components (browser). Uses `createBrowserClient` from `@supabase/ssr`.

   - **`src/lib/supabase/server.ts`** — Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers. Uses `createServerClient` from `@supabase/ssr` with cookie handling via `next/headers`.

   - **`src/lib/supabase/admin.ts`** — Creates a Supabase admin client using the service role key. Used only in server-side ingestion/admin code. Uses `createClient` from `@supabase/supabase-js` directly with the service role key. This client bypasses RLS.

8. **[CODE]** Create auth middleware at `src/middleware.ts`:
   - Use `createServerClient` from `@supabase/ssr` to refresh the user's session on every request.
   - Match all routes except static assets and `_next`.
   - This middleware only refreshes sessions — it does NOT gate access to routes (that happens in Phase 4's admin layout).

9. **[CODE]** Create shared types and constants:

   - **`src/lib/types.ts`** — TypeScript types for `Company`, `Snapshot`, `Job`, `LiveJob` (job + company_name + company_slug), `Click`.

   - **`src/lib/constants.ts`** — Department tag taxonomy array:
     ```typescript
     export const DEPARTMENT_TAGS = [
       'Engineering', 'Product', 'Design', 'Sales', 'Marketing',
       'Operations', 'Finance', 'Legal', 'Data', 'Customer Success',
       'People / HR', 'Other'
     ] as const;

     export type DepartmentTag = typeof DEPARTMENT_TAGS[number];

     export const JOBS_PER_PAGE = 25;
     ```

10. **[CODE]** Add placeholder logo files to `/public/logos/`:
    - `acme-corp.png`, `globex.png`, `initech.png`
    - These can be simple colored squares or any small placeholder image. They just need to exist so the UI can reference them.

### Verification

- [ ] `npm run dev` starts without errors
- [ ] Navigating to `localhost:3000` shows the default Next.js page
- [ ] Running `SELECT * FROM live_jobs;` in Supabase SQL Editor returns the seeded jobs
- [ ] All 3 Supabase client utilities import without errors
- [ ] `.env.example` exists and is committed; `.env.local` is gitignored

---

## Phase 2: Ingestion Pipeline

### Goal
Build the full ingestion pipeline: URL canonicalization, Hyperbrowser extraction, Haiku classification, validation, snapshot publishing, and cron scheduling. After this phase, curling the per-company endpoint ingests and publishes real jobs.

### Prerequisites
- Phase 1 complete
- Supabase populated with seed data (confirms schema works)

### Steps

1. **[USER]** Get API keys:
   - **Hyperbrowser**: Sign up at [hyperbrowser.ai](https://hyperbrowser.ai), get your API key.
   - **Anthropic**: Get an API key from [console.anthropic.com](https://console.anthropic.com).

2. **[USER]** Add API keys to `.env.local`:
   ```
   HYPERBROWSER_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   ```
   Also add these to `.env.example` as empty placeholders.

3. **[USER]** Add one real portfolio company for testing:
   - Insert a row into the `companies` table with a real `careers_url`.
   - Add a placeholder logo at `/public/logos/{slug}.png`.

4. **[CODE]** Install extraction and LLM packages:
   ```
   npm install @hyperbrowser/sdk @anthropic-ai/sdk
   ```

5. **[CODE]** Create ingestion utilities under `src/lib/ingestion/`:

   **`canonicalize.ts`**
   - `canonicalizeUrl(url: string): string` — Strip tracking params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`), remove trailing slashes, lowercase hostname. Preserve all other query params (some ATS platforms use them as job identifiers).
   - `generateJobKey(companyId: string, canonicalUrl: string): string` — Returns `sha256(companyId + canonicalUrl)`. Use Node.js `crypto` module.

   **`extract-listings.ts`**
   - `extractListings(careersUrl: string): Promise<string[]>` — Calls Hyperbrowser Extract API on the careers page URL. Uses the listing extraction prompt and schema from PRD §8. Returns an array of job URLs.

   **`extract-details.ts`**
   - `extractJobDetails(jobUrl: string): Promise<JobDetail | null>` — Calls Hyperbrowser Extract API on a single job URL. Uses the detail extraction prompt and schema from PRD §8. Returns structured data or null on failure.
   - Define `JobDetail` type: `{ title: string; department_raw: string | null; location: string | null; salary_raw: string | null; description: string }`.

   **`classify-department.ts`**
   - `classifyDepartment(title: string, departmentRaw: string | null, description: string): Promise<DepartmentTag>` — Sends title, raw department, and description to Claude Haiku (`claude-haiku-4-5-20251001`). Prompts the model to return exactly one value from the `DEPARTMENT_TAGS` taxonomy. Retry once on failure; if retry also fails, return `'Other'`.

   **`validate.ts`**
   - `isValidJobDetail(detail: JobDetail): boolean` — Returns true if `title` is non-empty and `description` is at least 50 characters.
   - `isValidRun(listingUrls: string[], validDetails: JobDetail[]): boolean` — Returns true if `listingUrls.length >= 1` AND `validDetails.length / listingUrls.length >= 0.7`.

   **`publish.ts`** *(most complex module)*
   - `publishSnapshot(companyId: string, jobs: ProcessedJob[]): Promise<void>`
   - Steps:
     1. Create a new snapshot row with `status = 'pending'`.
     2. For each job, look up whether a `first_seen_at` already exists for that `job_key` across any previous snapshot. If yes, preserve it. If no, set it to `now()`.
     3. Insert all job rows linked to the new snapshot.
     4. Update the snapshot to `status = 'published'` and set `job_count`.
     5. All of the above should happen in a transaction-like manner (if job inserts fail, don't publish).
   - `failSnapshot(companyId: string, errorMessage: string): Promise<void>` — Creates a snapshot with `status = 'failed'` and the error message.

6. **[CODE]** Create the per-company ingestion API route at `src/app/api/ingest/[companyId]/route.ts`:
   - Method: `POST`
   - Set `export const maxDuration = 300;` for Vercel Pro plan timeout.
   - Auth: Check `Authorization` header for `Bearer ${CRON_SECRET}`. Return 401 if missing/wrong.
   - Flow:
     1. Load company from DB by `companyId`. Return 404 if not found or not enabled.
     2. Call `extractListings(company.careers_url)` to get job URLs.
     3. Canonicalize all URLs.
     4. For each URL, call `extractJobDetails(url)`.
     5. **Important:** Track which URL produced which detail result. After filtering invalid details, you need the canonical URL for each valid detail to generate the `job_key`. Do NOT rely on array index alignment — use a mapping (e.g., array of `{ url, detail }` objects, then filter).
     6. Validate the run. If invalid, call `failSnapshot(companyId, reason)` and return.
     7. For each valid detail, call `classifyDepartment(...)`.
     8. Call `publishSnapshot(companyId, processedJobs)`.
     9. Return success response with job count.

7. **[CODE]** Create the dispatcher API route at `src/app/api/ingest/route.ts`:
   - Method: `GET`
   - Auth: Check `Authorization` header for `Bearer ${CRON_SECRET}`. Return 401 if missing/wrong.
   - Flow:
     1. Load all enabled companies from DB.
     2. For each company, fire a `fetch()` call to `${NEXT_PUBLIC_SITE_URL}/api/ingest/${company.id}` with the `Authorization` header. **Do not await** these calls (fire-and-forget fan-out).
     3. Return immediately with a response listing the companies that were dispatched.

8. **[CODE]** Create `vercel.json` at the project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/ingest",
         "schedule": "0 6 * * 1"
       }
     ]
   }
   ```
   This fires every Monday at 6:00 AM UTC. The cron endpoint authenticates via `CRON_SECRET`.

### Verification

- [ ] Run: `curl -X POST http://localhost:3000/api/ingest/{companyId} -H "Authorization: Bearer $CRON_SECRET"` for the real test company
- [ ] Check Supabase: a new snapshot exists with `status = 'published'`
- [ ] Check Supabase: jobs are present in the `jobs` table linked to the new snapshot
- [ ] Check Supabase: `SELECT * FROM live_jobs WHERE company_id = '{id}'` returns the ingested jobs
- [ ] Department tags are from the taxonomy (no free-form values)
- [ ] Running again preserves `first_seen_at` for unchanged job_keys

---

## Phase 3: Public Pages + Click Tracking

### Goal
Build the public-facing directory listing, job detail pages, and outbound click redirect. This phase can be built in parallel with Phase 2 using seed data from Phase 1.

### Prerequisites
- Phase 1 complete (seed data in DB)

### Steps

1. **[CODE]** Install markdown rendering:
   ```
   npm install react-markdown
   ```

2. **[CODE]** Build shared UI components under `src/components/`:

   **`header.tsx`**
   - Site name/logo, navigation link to `/jobs`.

   **`footer.tsx`**
   - Simple footer with copyright.

   **`job-card.tsx`**
   - Displays: company logo (from `/logos/{company_slug}.png`), company name, job title (links to `/jobs/{job_key}`), department tag, location (if present), salary (if present).
   - The job title or an "Apply" action should link through `/r/{job_key}` for outbound tracking.

   **`job-filters.tsx`**
   - Department filter: dropdown or button group using `DEPARTMENT_TAGS`.
   - Company filter: dropdown populated from the companies present in results.
   - Filters work via URL search params (e.g., `?department=Engineering&company=acme-corp`).
   - Filters are links/form submissions, not client-side state — this preserves SSR and shareability.

   **`pagination.tsx`**
   - Server-side pagination controls (Previous / Next).
   - Uses `?page=N` search param.
   - Shows current page and total page count.

   **`markdown-renderer.tsx`**
   - Wrapper around `react-markdown` for rendering job descriptions.
   - Apply appropriate Tailwind typography styles (consider `@tailwindcss/typography` plugin or manual prose styling).

3. **[CODE]** Create the root layout at `src/app/layout.tsx`:
   - Include header and footer.
   - Set up base metadata (site title, description).

4. **[CODE]** Create root page redirect:
   - `src/app/page.tsx` — Redirect to `/jobs` using `redirect()` from `next/navigation`.

5. **[CODE]** Build the directory listing page at `src/app/jobs/page.tsx`:
   - **Server Component** (SSR).
   - Read search params: `department`, `company`, `page`.
   - Query `live_jobs` view from Supabase with:
     - Optional department filter (exact match on `department_tag`).
     - Optional company filter (exact match on `company_slug`).
     - Sort: `first_seen_at DESC`, then `company_name ASC`, then `title ASC`.
     - Pagination: offset-based, 25 per page (`JOBS_PER_PAGE`).
     - Also fetch total count for pagination controls.
   - Render the job cards, filters, and pagination.
   - Set page metadata: descriptive title and meta description.

6. **[CODE]** Build the job detail page at `src/app/jobs/[job_key]/page.tsx`:
   - **Server Component** (SSR).
   - Query `live_jobs` by `job_key`. Return `notFound()` if not found.
   - Display: job title, company name + logo, department tag, location, salary (if present), full description (rendered via markdown-renderer).
   - Primary CTA button: "View on {company name}" linking to `/r/{job_key}` with `target="_blank"` and `rel="noopener noreferrer"`.
   - **Metadata generation** (via `generateMetadata`):
     - `title`: `"{Job Title} at {Company Name}"`
     - `description`: first ~155 characters of the job description (plain text, strip markdown)
     - Canonical URL: `${NEXT_PUBLIC_SITE_URL}/jobs/{job_key}`

7. **[CODE]** Create `src/app/jobs/[job_key]/not-found.tsx`:
   - Simple "Job not found" page.

8. **[CODE]** Build the click redirect route at `src/app/r/[job_key]/route.ts`:
   - Method: `GET`
   - Flow:
     1. Look up the job by `job_key` in `live_jobs`.
     2. If not found, return 404 response.
     3. Insert a row into `clicks` with `job_key`, `company_id`, and current timestamp.
     4. Issue a `302` redirect to the job's `job_url`.
   - **Security:** Never accept a URL as a query parameter. The redirect target always comes from the database.

### Verification

- [ ] `/jobs` renders the directory with seed data
- [ ] Department and company filters work (URL search params change, results filter)
- [ ] Pagination works (page 1 shows 25 results if enough data, page navigation works)
- [ ] Clicking a job title navigates to `/jobs/{job_key}` with full detail
- [ ] Job detail page shows title, company, department, location, salary, and rendered Markdown description
- [ ] "View on {company}" button links through `/r/{job_key}`
- [ ] `/r/{job_key}` inserts a click record in the `clicks` table and redirects with 302
- [ ] `/r/nonexistent` returns 404
- [ ] Root `/` redirects to `/jobs`
- [ ] View page source confirms SSR (content present in HTML, not client-rendered)

---

## Phase 4: Admin Dashboard

### Goal
Build a protected admin area with email/password login, a company status dashboard, and controls to re-run ingestion or toggle companies.

### Prerequisites
- Phase 1 complete (Supabase Auth configured)
- Phase 2 complete (ingestion pipeline exists to trigger re-runs)

### Steps

1. **[USER]** Create an admin user in Supabase:
   - Go to Supabase Dashboard → Authentication → Users → Add User.
   - Create a user with email/password. This is the only admin user for v1.

2. **[CODE]** Build the admin login page at `src/app/admin/login/page.tsx`:
   - Simple email + password form.
   - On submit, call Supabase Auth `signInWithPassword`.
   - On success, redirect to `/admin`.
   - On error, display error message inline.
   - This page is NOT protected by the auth gate (it's the entry point).

3. **[CODE]** Build the admin layout at `src/app/admin/layout.tsx`:
   - Server-side auth check: call `supabase.auth.getUser()` using the server Supabase client.
   - If no authenticated user, redirect to `/admin/login`.
   - If authenticated, render children with an admin nav bar (includes logout button).
   - **Important:** Use `getUser()` (which validates with the Supabase auth server), not `getSession()` (which only reads the local JWT and can be spoofed).

4. **[CODE]** Build a logout Server Action or API route:
   - Calls `supabase.auth.signOut()`.
   - Redirects to `/admin/login`.

5. **[CODE]** Build the admin dashboard page at `src/app/admin/page.tsx`:
   - Server Component.
   - Query all companies with their latest snapshot (regardless of status).
   - Display a table/list showing per company:
     - Company name
     - Enabled/disabled status
     - Careers URL
     - Last run time (from latest snapshot's `created_at`)
     - Last run status (`published`, `failed`, or `pending`)
     - Job count (from latest published snapshot)
     - Error message (if latest snapshot is `failed`) — display prominently as an alert/warning
   - Actions per company:
     - "Re-run" button → triggers ingestion
     - "Enable/Disable" toggle
     - "Edit URL" inline edit or modal

6. **[CODE]** Create admin API routes (all auth-gated):

   **`src/app/api/admin/rerun/route.ts`**
   - Method: `POST`
   - Body: `{ companyId: string }`
   - Auth: Call `supabase.auth.getUser()` on the server client. Return 401 if unauthenticated.
   - Action: Fire a fetch to `/api/ingest/${companyId}` with `Authorization: Bearer ${CRON_SECRET}`. Do not await (fire-and-forget).
   - Return success immediately.

   **`src/app/api/admin/company/route.ts`**
   - Method: `PATCH`
   - Body: `{ companyId: string, careers_url?: string, enabled?: boolean }`
   - Auth: Same `getUser()` check.
   - Action: Update the company row in Supabase.
   - Return updated company.

7. **[CODE]** Wire up the dashboard actions:
   - "Re-run" button calls `POST /api/admin/rerun` and shows a toast/message that ingestion was triggered.
   - "Enable/Disable" toggle calls `PATCH /api/admin/company` with `{ enabled: !current }`.
   - "Edit URL" submits the new URL via `PATCH /api/admin/company`.

### Verification

- [ ] Navigating to `/admin` while logged out redirects to `/admin/login`
- [ ] Logging in with correct credentials redirects to `/admin`
- [ ] Logging in with wrong credentials shows an error
- [ ] Admin dashboard displays all companies with correct status data
- [ ] Failed snapshots show error messages prominently
- [ ] "Re-run" button triggers ingestion (check that a new snapshot appears in DB)
- [ ] Toggling enabled/disabled persists to DB and updates the UI
- [ ] Editing careers URL persists to DB
- [ ] Logout redirects to login page and `/admin` is no longer accessible
- [ ] API routes return 401 when called without auth

---

## Phase 5: SEO, Security & Production Hardening

### Goal
Add SEO infrastructure, security headers, RLS policies, error handling, and polish for production deployment.

### Prerequisites
- Phase 3 complete (public pages exist)

### Steps

1. **[CODE]** Create dynamic sitemap at `src/app/sitemap.ts`:
   - Export a `sitemap()` function (Next.js App Router convention).
   - Query all `live_jobs` and generate entries:
     - One entry for `/jobs` (the directory listing)
     - One entry per job: `/jobs/{job_key}`
   - Set `changeFrequency: 'weekly'` and a `lastModified` date.
   - Use `NEXT_PUBLIC_SITE_URL` as the base URL.

2. **[CODE]** Create `robots.txt` at `src/app/robots.ts`:
   - Export a `robots()` function (Next.js App Router convention).
   - Rules:
     - Allow: `/`
     - Disallow: `/admin/`
     - Disallow: `/api/`
   - Include sitemap URL: `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`

3. **[CODE]** Create loading and error UI:
   - `src/app/jobs/loading.tsx` — Loading skeleton for the directory page (placeholder cards).
   - `src/app/jobs/[job_key]/loading.tsx` — Loading skeleton for the detail page.
   - `src/app/not-found.tsx` — Global 404 page.
   - `src/app/error.tsx` — Global error boundary (Client Component with `reset` function).

4. **[CODE]** Add Open Graph and Twitter Card metadata to job detail pages:
   - In `src/app/jobs/[job_key]/page.tsx`, extend the `generateMetadata` function:
     ```typescript
     openGraph: {
       title: `${job.title} at ${job.company_name}`,
       description: truncatedDescription,
       url: `${siteUrl}/jobs/${job.job_key}`,
       type: 'website',
     },
     twitter: {
       card: 'summary',
       title: `${job.title} at ${job.company_name}`,
       description: truncatedDescription,
     }
     ```

5. **[CODE]** Add security headers via `next.config.ts`:
   ```typescript
   headers: async () => [
     {
       source: '/(.*)',
       headers: [
         { key: 'X-Frame-Options', value: 'DENY' },
         { key: 'X-Content-Type-Options', value: 'nosniff' },
         { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
       ],
     },
   ],
   ```

6. **[CODE]** Create Supabase Row Level Security (RLS) policies. Add a new migration at `supabase/migrations/002_rls_policies.sql`:

   **Enable RLS on all tables:**
   ```sql
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
   ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
   ```

   **Policies:**
   - `companies`: Public can SELECT where `enabled = true`.
   - `snapshots`: Public can SELECT where `status = 'published'`.
   - `jobs`: Public can SELECT where `snapshot_id` belongs to a published snapshot.
   - `clicks`: Public can INSERT (anyone can record a click). No public SELECT (click data is admin-only).
   - The service role key bypasses RLS entirely (used by ingestion and admin API routes).

   **Important:** Run this migration in the Supabase SQL Editor.

7. **[USER]** Set up Vercel deployment:
   - Create a new Vercel project linked to this repo.
   - Add all environment variables in Vercel project settings:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `CRON_SECRET`
     - `NEXT_PUBLIC_SITE_URL` (set to production domain)
     - `HYPERBROWSER_API_KEY`
     - `ANTHROPIC_API_KEY`
   - Deploy and verify the site loads.
   - Check Vercel dashboard → Cron Jobs to verify the weekly cron is registered.

### Verification

- [ ] `/sitemap.xml` returns valid XML with entries for `/jobs` and all live job detail pages
- [ ] `/robots.txt` allows `/`, disallows `/admin/` and `/api/`, includes sitemap URL
- [ ] Loading skeletons appear during navigation
- [ ] `/nonexistent-page` shows the custom 404 page
- [ ] Job detail pages have OG and Twitter card meta tags (inspect page source or use a social media debugger)
- [ ] Response headers include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Using the anon key directly: can SELECT from `live_jobs`, can INSERT into `clicks`, cannot SELECT from `clicks`, cannot INSERT/UPDATE/DELETE companies/snapshots/jobs
- [ ] Vercel cron job appears in the dashboard and fires on schedule

---

## Phase 6: Company Onboarding & E2E Validation

### Goal
Onboard all ~30 portfolio companies, run full ingestion, and validate the production system end-to-end.

### Prerequisites
- All previous phases complete and deployed to production

### Steps

1. **[USER]** Prepare company data:
   - Compile a list of all ~30 portfolio companies with: `name`, `slug`, `careers_url`, and a logo image file.
   - Ensure each `slug` is URL-safe (lowercase, hyphens, no special characters).
   - Verify each `careers_url` is a public page listing open jobs.

2. **[CODE]** Create a bulk insert migration at `supabase/migrations/003_bulk_companies.sql`:
   - Insert all ~30 companies into the `companies` table.
   - Use `ON CONFLICT (slug) DO UPDATE` to handle re-runs safely.
   - Remove the seed companies from Phase 1 if they are not real portfolio companies.

3. **[CODE]** Add all company logos to `/public/logos/`:
   - One PNG per company: `{slug}.png`.
   - Consistent dimensions (recommended: 128x128 or 256x256).

4. **[USER]** Run the bulk insert migration in the Supabase SQL Editor.

5. **[USER]** Trigger a full ingestion run:
   - Option A: Call the dispatcher endpoint:
     ```
     curl "https://{your-domain}/api/ingest" -H "Authorization: Bearer $CRON_SECRET"
     ```
   - Option B: Use the admin dashboard to re-run companies individually.

6. **[USER]** Review results in the admin dashboard:
   - Check each company's status.
   - For failed companies: inspect the error message, check if the careers URL is correct, check if the page requires special handling.
   - Disable companies that consistently fail (can revisit later).
   - Target: **at least 80% of companies should ingest successfully** on the first run.

7. **[USER]** Validate the live directory:
   - Browse `/jobs` and verify jobs appear from multiple companies.
   - Test department and company filters.
   - Test pagination with the full dataset.
   - Click through to several job detail pages.
   - Click the CTA on a few jobs to verify redirect works and clicks are recorded.
   - Check the sitemap includes all live jobs.

8. **[CODE]** (Optional) Add analytics:
   - Install Vercel Analytics (`@vercel/analytics`) or configure Plausible.
   - Add the analytics script/component to the root layout.
   - This covers the PRD's page view tracking requirement (§6.1).

9. **[USER]** (Optional) Configure a custom domain:
   - Add a custom domain in Vercel project settings.
   - Update `NEXT_PUBLIC_SITE_URL` environment variable to the new domain.
   - Update DNS records as instructed by Vercel.
   - Redeploy to pick up the new site URL.

10. **[USER]** Final production checklist:
    - [ ] All environment variables are set in Vercel (no dev/placeholder values)
    - [ ] `CRON_SECRET` is a strong random value (not a placeholder)
    - [ ] Supabase RLS policies are active (Phase 5 migration applied)
    - [ ] Vercel cron job is registered and will fire weekly
    - [ ] Admin dashboard is accessible and shows accurate data
    - [ ] At least 80% of companies have successful ingestion
    - [ ] Sitemap is valid and discoverable
    - [ ] `robots.txt` is correct
    - [ ] Security headers are present on all responses
    - [ ] Custom domain (if applicable) resolves correctly with HTTPS

### Verification

- [ ] ≥80% of portfolio companies have a published snapshot with jobs
- [ ] `/jobs` displays jobs from multiple companies, sorted correctly
- [ ] Filters and pagination work at scale (~30 companies, hundreds of jobs)
- [ ] Job detail pages render correctly for real job data
- [ ] Outbound clicks are recorded in the `clicks` table
- [ ] Admin dashboard shows accurate status for all companies
- [ ] Vercel cron fires on schedule (check Vercel logs after next Monday 6:00 AM UTC)
- [ ] No console errors or broken images on any public page
