# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio Job Directory — a public job board that aggregates open roles across ~30 portfolio companies and directs candidates to original postings. Discovery and traffic generation only; no ATS, no candidate accounts.

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript, Tailwind CSS)
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL) via `@supabase/supabase-js` and `@supabase/ssr`
- **Auth**: Supabase Auth (admin-only, email/password)
- **Scraping**: Hyperbrowser Extract API (`@hyperbrowser/sdk`)
- **LLM (department tagging)**: Anthropic API — Claude Haiku (`@anthropic-ai/sdk`)
- **Markdown rendering**: `react-markdown`

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
```

## Architecture

### Supabase Clients (3 variants)
- `src/lib/supabase/browser.ts` — Client Components (browser), uses `createBrowserClient`
- `src/lib/supabase/server.ts` — Server Components/Actions/Route Handlers, uses `createServerClient` with cookie handling
- `src/lib/supabase/admin.ts` — Service role client for ingestion/admin (bypasses RLS), uses `createClient` directly

### Database
- **Tables**: `companies`, `snapshots`, `jobs`, `clicks`
- **Key view**: `live_jobs` — joins jobs from the latest published snapshot per enabled company; this is the only view public pages query
- **Migrations**: `supabase/migrations/` — run manually in Supabase SQL Editor
- **Job identity**: `job_key = sha256(company_id + canonical_job_url)`

### Ingestion Pipeline (`src/lib/ingestion/`)
Two-step extraction per company: listing extraction (get job URLs from careers page) → detail extraction (structured data per job URL). Runs weekly via Vercel Cron.

- **Dispatcher** (`/api/ingest`) — fires parallel requests to per-company endpoints (fire-and-forget)
- **Per-company** (`/api/ingest/[companyId]`) — runs extraction, classification, validation, and snapshot publishing; `maxDuration: 300`
- **Validation**: run is valid if ≥1 URL found AND ≥70% of detail extractions succeed (title non-empty, description ≥50 chars)
- **Snapshot model**: invalid runs save `status = 'failed'`; last published snapshot stays live

### Route Structure
- `/jobs` — SSR directory listing with server-side pagination (25/page) and filters (department, company via URL params)
- `/jobs/[job_key]` — SSR job detail page with SEO metadata
- `/r/[job_key]` — Click redirect: logs to `clicks` table, 302 to stored job URL (never accepts URL param)
- `/admin` — Auth-gated dashboard (Supabase Auth `getUser()`, not `getSession()`)
- `/api/admin/*` — Admin actions (rerun, company update), auth-gated via `getUser()`
- `/api/ingest` — Cron dispatcher, auth via `CRON_SECRET` bearer token

### Key Constants (`src/lib/constants.ts`)
- `DEPARTMENT_TAGS` — 12-value taxonomy for department classification
- `JOBS_PER_PAGE = 25`

## Environment Variables

See `.env.example`. Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (authenticates ingestion endpoints)
- `HYPERBROWSER_API_KEY`, `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Implementation Phases

The project follows 6 sequential phases defined in `IMPLEMENTATION_PHASES.md`. Phases 2 and 3 can run in parallel after Phase 1. Steps marked `[USER]` require manual action; steps marked `[CODE]` are implementation tasks.

## Important Patterns

- **Auth**: Admin routes use `supabase.auth.getUser()` (server-validated), never `getSession()` (JWT-only)
- **Ingestion auth**: Bearer token via `CRON_SECRET`, checked in `Authorization` header
- **Filters**: URL search params (`?department=X&company=Y&page=N`), not client-side state — preserves SSR
- **Logos**: Static files at `/public/logos/{company_slug}.png`, updated via code changes
- **URL canonicalization**: Strip tracking params (utm_*, fbclid, gclid, mc_cid, mc_eid), remove trailing slashes, lowercase hostname; preserve all other query params
- **Department tagging**: LLM classification via Claude Haiku with one retry; falls back to "Other"
