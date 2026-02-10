export interface Company {
  id: string;
  name: string;
  slug: string;
  careers_url: string | null;
  homepage_url: string | null;
  enabled: boolean;
  created_at: string;
}

export interface Snapshot {
  id: string;
  company_id: string;
  status: "pending" | "published" | "failed";
  job_count: number;
  error_message: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  job_key: string;
  snapshot_id: string;
  company_id: string;
  title: string;
  department_tag: string;
  department_raw: string | null;
  location: string | null;
  salary_raw: string | null;
  description: string;
  job_url: string;
  first_seen_at: string;
  created_at: string;
}

export interface LiveJob extends Job {
  company_name: string;
  company_slug: string;
}

export interface Click {
  id: string;
  job_key: string;
  company_id: string;
  clicked_at: string;
}
