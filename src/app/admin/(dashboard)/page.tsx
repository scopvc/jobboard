import { createAdminClient } from "@/lib/supabase/admin";
import { AdminTable } from "./admin-table";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  careers_url: string | null;
  enabled: boolean;
  latest_snapshot_status: string | null;
  latest_snapshot_at: string | null;
  latest_error: string | null;
  published_job_count: number;
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .order("name");

  if (!companies) return <p className="text-sm text-gray-500">No companies found.</p>;

  // Get latest snapshot per company (any status)
  const { data: latestSnapshots } = await supabase
    .from("snapshots")
    .select("company_id, status, error_message, created_at")
    .order("created_at", { ascending: false });

  // Get latest published snapshot job counts
  const { data: publishedSnapshots } = await supabase
    .from("snapshots")
    .select("company_id, job_count")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const latestByCompany = new Map<string, { status: string; created_at: string; error_message: string | null }>();
  latestSnapshots?.forEach((s) => {
    if (!latestByCompany.has(s.company_id)) {
      latestByCompany.set(s.company_id, s);
    }
  });

  const publishedCountByCompany = new Map<string, number>();
  publishedSnapshots?.forEach((s) => {
    if (!publishedCountByCompany.has(s.company_id)) {
      publishedCountByCompany.set(s.company_id, s.job_count);
    }
  });

  const rows: CompanyRow[] = companies.map((c) => {
    const latest = latestByCompany.get(c.id);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      careers_url: c.careers_url,
      enabled: c.enabled,
      latest_snapshot_status: latest?.status ?? null,
      latest_snapshot_at: latest?.created_at ?? null,
      latest_error: latest?.error_message ?? null,
      published_job_count: publishedCountByCompany.get(c.id) ?? 0,
    };
  });

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-black">
        Companies
      </h1>
      <AdminTable rows={rows} />
    </div>
  );
}
