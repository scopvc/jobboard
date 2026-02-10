# Portfolio Job Directory — Product Requirements Document (v1)

## 1. Overview

### Objective

Build a **simple, public job directory** that aggregates open roles across portfolio companies and directs candidates to the original job postings. The directory's purpose is discovery and traffic generation, not recruiting workflow management.

### Success Metrics

* Total visits to the job directory
* Total outbound clicks to job pages
* Outbound clicks by portfolio company
* (Secondary) job page views per role

---

## 2. Scope

### In Scope (v1)

* Public-facing job directory
* Weekly ingestion of jobs from portfolio company careers pages
* Department-level tagging
* Job descriptions stored as Markdown
* Salary display **only if explicitly listed**
* Internal job detail pages
* Basic analytics: job views + outbound clicks
* Lightweight admin controls for ingestion failures

### Explicit Non-Goals

* Application handling or ATS integration
* Candidate accounts, profiles, or resumes
* Salary inference or normalization
* Real-time job updates
* User-level analytics or attribution
* Email alerts (planned v2)

---

## 3. Users

* **Candidates**: browse and click through to portfolio job postings
* **Internal team**: monitor directory usage and ingestion health

---

## 4. Functional Requirements

### 4.1 Job Ingestion

#### Inputs

* One manually configured careers/jobs page URL per portfolio company (~30 companies)
* One logo per company, stored in the repo at `/public/logos/{company_slug}.png`

#### Cadence

* Weekly per company

#### Ingestion Pattern (Two-Step)

1. **Listing extraction**: extract all individual job posting URLs from the careers page
2. **Detail extraction**: visit each job URL to extract structured data and full description

#### Extracted Fields (per job)

* Title (string)
* Department (raw text, nullable)
* Location (string, nullable)
* Salary (raw text, nullable; only if explicitly shown)
* Description (Markdown — see §4.5)
* Job URL (canonicalized)

#### Job Identity

* Each job is assigned a stable internal key:

  ```
  job_key = sha256(company_id + canonical_job_url)
  ```
* Canonicalization rules:
  * Strip known tracking parameters: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`
  * Preserve all other query parameters (some ATS platforms use them as job identifiers)
  * Remove trailing slashes
  * Lowercase the hostname

---

### 4.2 Department Tagging

* Tag taxonomy (v1):

  * Engineering
  * Product
  * Design
  * Sales
  * Marketing
  * Operations
  * Finance
  * Legal
  * Data
  * Customer Success
  * People / HR
  * Other
* Tagging via LLM classification: the raw department string, job title, and description are sent to a lightweight LLM (Claude Haiku) that returns one taxonomy value. This avoids maintaining a brittle keyword map and handles edge cases like "GTM Engineering" or "People & Places" correctly.
* Failure handling: retry once on LLM failure; if the retry also fails, default to "Other"
* Raw department string is always preserved

---

### 4.3 Snapshot & Publishing Model

* Each weekly run produces a **company snapshot**
* Snapshots are only published if validation rules pass

#### Validation Rules

A job detail extraction is considered **valid** if the response conforms to the extraction schema, `title` is non-empty, and `description` is ≥50 characters (to reject error pages and empty extractions).

A run is considered valid if:

* Listing extraction returns ≥1 job URL, AND
* ≥70% of job URLs return a valid job detail extraction (per the definition above)

#### Failure Handling

* If a run fails validation, the **last published snapshot remains live**
* No partial snapshots are ever shown
* On any snapshot failure, the snapshot is saved with `status = failed` and an `error_message`. The admin dashboard surfaces failed snapshots as alerts so failures are not silently ignored.

---

### 4.4 Admin Controls (Minimal)

* View per-company status:

  * Last run time
  * Success / failure
  * Job count
* Actions:

  * Manually re-run ingestion for a company
  * Disable a company from publishing
  * Edit careers page URL

No full CRUD job editing is required.

> **Note:** Company logos are managed as static files in the repo (`/public/logos/{company_slug}.png`), not through the admin dashboard. Updating a logo is a code change + deploy.

---

### 4.5 Description Format

Job descriptions are stored as **Markdown**. During extraction, the raw description should preserve structural formatting — headings, bullet points, numbered lists, and paragraph breaks — converted to Markdown syntax. Inline HTML is stripped. This ensures descriptions remain readable when rendered on the job detail page while staying portable and lightweight.

---

## 5. User Experience

### 5.1 Job Directory Page

* Displays all jobs across portfolio companies
* Default sort: most recently first-seen jobs first (each job carries a `first_seen_at` timestamp set when its `job_key` first appears, persisted across snapshots), then alphabetical by company name, then alphabetical by title
* Pagination: server-side, 25 jobs per page
* Job cards include:

  * Company name and logo
  * Job title
  * Department tag
  * Location (if present)
  * Salary (if present)
* Filters:

  * Department
  * Company

### 5.2 Job Detail Page (Internal)

* URL: `/jobs/{job_key}`
* Displays:

  * Job title
  * Company name and logo
  * Department tag
  * Location
  * Salary (if present)
  * Full description rendered from Markdown
* Primary CTA:

  * "View job on company site" (opens job URL in new tab via redirect)

### 5.3 SEO

* Job detail pages are the primary SEO surface. Each page has unique content (description, title, company) and should be indexable.
* Pages must be server-side rendered or statically generated — no client-only rendering.
* Each job detail page should include:
  * `<title>`: `{Job Title} at {Company Name}`
  * `<meta name="description">`: first ~155 characters of the job description
  * Canonical URL: `https://{domain}/jobs/{job_key}`
* The directory listing page should have a stable canonical URL and a descriptive title/meta.
* Generate a sitemap (`/sitemap.xml`) that includes all published job detail pages, updated after each ingestion cycle.

---

## 6. Analytics (v1)

### 6.1 Page Views

* Track:

  * Total directory visits
  * Per-job detail page views
* Tooling:

  * Existing site analytics or lightweight analytics solution

### 6.2 Outbound Clicks

* All outbound job links route through a redirect endpoint:

  * `/r/{job_key}`
* On redirect:

  * Look up the job's target URL from the database
  * If the job key is not found, return 404 (never accept a URL as a query parameter)
  * Insert a click record into the `clicks` table
  * Issue 302 redirect to the stored job URL

#### Metrics Stored

* Total outbound clicks
* Outbound clicks by company
* Outbound clicks by job

No user identity, deduplication, or attribution is required.

---

## 7. Technical Architecture & Stack

### 7.1 Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL) |
| Auth (admin only) | Supabase Auth |
| Logos | Static assets in repo (`/public/logos/`) |
| Scraping | Hyperbrowser Extract API (see §8) |
| LLM (department tagging) | Anthropic API — Claude Haiku |
| Analytics | Vercel Analytics or Plausible |

### 7.2 Key Packages

| Package | Purpose |
| --- | --- |
| `@supabase/supabase-js` | Database client, auth |
| `@supabase/ssr` | Supabase helpers for Next.js server components |
| `@anthropic-ai/sdk` | Department tagging LLM calls |
| `@hyperbrowser/sdk` | Extract API for job ingestion |
| `react-markdown` | Render Markdown descriptions on job detail pages |
| `next/sitemap` or `next-sitemap` | Sitemap generation for SEO |

### 7.3 Architecture

```
┌──────────────────────────────────────────────────────┐
│                      Vercel                           │
│                                                       │
│  Next.js App                                          │
│  ├── Public pages (SSR)                               │
│  │   ├── /jobs              Directory listing         │
│  │   └── /jobs/[job_key]    Job detail                │
│  │                                                    │
│  ├── Admin pages (authed)                             │
│  │   └── /admin             Ingestion dashboard       │
│  │                                                    │
│  └── API routes                                       │
│      ├── /r/[job_key]                Click redirect   │
│      ├── /api/ingest                 Dispatcher       │
│      ├── /api/ingest/[company_id]    Per-company run  │
│      └── /api/admin/*                Admin actions    │
│                                                       │
│  Cron (Vercel Cron)                                   │
│  └── Weekly trigger → /api/ingest (dispatcher)        │
└──────────────┬──────────────┬─────────────────────────┘
               │              │
    ┌──────────▼──┐    ┌──────▼───────┐
    │  Supabase   │    │ External APIs │
    │  ├─ Postgres│    │ ├─ Hyperbrowser
    │  └─ Auth    │    │ └─ Anthropic
    └─────────────┘    └──────────────┘
```

### 7.4 Ingestion Flow

Ingestion uses a **dispatcher + per-company fan-out** to stay within Vercel function timeout limits.

1. Vercel Cron fires weekly, calling `/api/ingest` (the dispatcher)
2. The dispatcher reads all enabled companies from Supabase and fires parallel fetch calls to `/api/ingest/[company_id]` — one per company. The dispatcher does **not** await responses (fire-and-forget); each per-company function runs as an independent invocation and writes its own result to the snapshots table.
3. Each per-company function (`maxDuration: 300`):
   a. Hyperbrowser Extract API → listing extraction → job URLs
   b. Hyperbrowser Extract API → detail extraction per job URL → structured data
   c. Anthropic Haiku → department classification per job
   d. Validate run (≥1 URL, ≥70% detail success)
   e. If valid: write new snapshot to Supabase, mark as published, set `first_seen_at` for any new job_keys
   f. If invalid: save snapshot with `status = failed` and `error_message`, retain last published snapshot

### 7.5 Database Schema (Logical)

* **companies** — id, name, slug, careers_url, enabled, created_at
* **snapshots** — id, company_id, status (pending/published/failed), job_count, error_message, created_at
* **jobs** — id, job_key, snapshot_id, company_id, title, department_tag, department_raw, location, salary_raw, description, job_url, first_seen_at, created_at
* **clicks** — id, job_key, company_id, clicked_at

The public directory queries only jobs belonging to the latest published snapshot per company.

---

## 8. Central Scraping Utility — Hyperbrowser Extract API

### Role

Hyperbrowser Extract API is the sole mechanism used to ingest job data from portfolio company websites.

### Workflow

Hyperbrowser is called within the per-company ingestion flow described in §7.4. For each company:

1. Call Extract API on the careers page to retrieve job URLs (listing extraction)
2. Call Extract API on each job URL to retrieve structured job data (detail extraction)

Validation and publishing are handled by the ingestion function after extraction completes.

### Listing Extraction

**Prompt:**
Extract all URLs that correspond to currently open individual job postings from this careers page. Exclude category pages, filters, general careers links, and closed roles. Return each URL once.

**Schema:**

```json
{
  "type": "object",
  "properties": {
    "job_urls": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["job_urls"]
}
```

### Job Detail Extraction

**Prompt:**
From this job posting page, extract the job title, department/team (if explicitly present), location (if present), salary or compensation (only if explicitly shown), and the full job description as Markdown preserving headings, bullet points, and paragraph structure. Do not infer missing values.

**Schema:**

```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "department_raw": { "type": ["string", "null"] },
    "location": { "type": ["string", "null"] },
    "salary_raw": { "type": ["string", "null"] },
    "description": { "type": "string" }
  },
  "required": ["title", "description"]
}
```

Session options (proxy, CAPTCHA solving) should be enabled only if required.

---

## 9. Risks & Mitigations

| Risk                           | Mitigation                       |
| ------------------------------ | -------------------------------- |
| Scrape failure wipes jobs      | Snapshot publish gating          |
| Careers page structure changes | Weekly cadence + admin re-run    |
| Duplicate listings             | Canonical URL + job_key          |
| JS-heavy pages                 | Hyperbrowser headless extraction |
| Vercel function timeout        | Dispatcher + per-company fan-out (§7.4) |
| Hyperbrowser credit budget     | Estimated ~42k credits/month (~12% of 360k Startup plan). ~30 listing calls at ~12 credits + ~450 detail calls at ~21 credits per week. Monitor monthly. |

---

## 10. Future Considerations (Not v1)

* Email alerts (weekly digests)
* Company-specific subscriptions
* Advanced filtering (remote, seniority)
* Rich analytics and attribution

---

**This PRD defines a deliberately minimal v1. Any additions must be explicitly justified against scope creep.**
