-- 001_initial_schema.sql
-- Portfolio Job Directory — initial database schema

-- Companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  careers_url text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Snapshots table
CREATE TABLE snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  status text NOT NULL CHECK (status IN ('pending', 'published', 'failed')),
  job_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Jobs table
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key text NOT NULL,
  snapshot_id uuid NOT NULL REFERENCES snapshots(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  title text NOT NULL,
  department_tag text NOT NULL,
  department_raw text,
  location text,
  salary_raw text,
  description text NOT NULL,
  job_url text NOT NULL,
  first_seen_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Clicks table
CREATE TABLE clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key text NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id),
  clicked_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_jobs_job_key ON jobs(job_key);
CREATE INDEX idx_jobs_snapshot_id ON jobs(snapshot_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_snapshots_company_status ON snapshots(company_id, status);
CREATE INDEX idx_clicks_job_key ON clicks(job_key);
CREATE INDEX idx_clicks_company_id ON clicks(company_id);

-- View: live_jobs
-- Returns all jobs belonging to the latest published snapshot per enabled company.
-- This is the only view the public directory queries.
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
