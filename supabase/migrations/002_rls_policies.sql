-- 002_rls_policies.sql
-- Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Companies: public can read enabled companies
CREATE POLICY "Public can read enabled companies"
  ON companies FOR SELECT
  USING (enabled = true);

-- Snapshots: public can read published snapshots
CREATE POLICY "Public can read published snapshots"
  ON snapshots FOR SELECT
  USING (status = 'published');

-- Jobs: public can read jobs from published snapshots
CREATE POLICY "Public can read jobs from published snapshots"
  ON jobs FOR SELECT
  USING (
    snapshot_id IN (
      SELECT id FROM snapshots WHERE status = 'published'
    )
  );

-- Clicks: public can insert (record clicks), no public reads
CREATE POLICY "Public can insert clicks"
  ON clicks FOR INSERT
  WITH CHECK (true);

-- live_jobs view: set to invoker security so it respects RLS of underlying tables
ALTER VIEW live_jobs SET (security_invoker = on);
