import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Max companies to ingest concurrently (each uses 1+ Hyperbrowser sessions)
const BATCH_SIZE = 5;

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Load all enabled companies that have a careers URL
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("enabled", true)
    .not("careers_url", "is", null);

  if (error || !companies) {
    return NextResponse.json(
      { error: "Failed to load companies" },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const dispatched: string[] = [];

  // Dispatch in batches to stay within Hyperbrowser concurrent session limits
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((company) =>
        fetch(`${siteUrl}/api/ingest/${company.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        })
      )
    );
    dispatched.push(...batch.map((c) => c.name));
  }

  return NextResponse.json({
    dispatched,
    count: dispatched.length,
  });
}
