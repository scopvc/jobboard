import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalizeUrl, generateJobKey } from "@/lib/ingestion/canonicalize";
import { DEPARTMENT_TAGS } from "@/lib/constants";

async function authCheck() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { company_id, title, department_tag, location, salary_raw, job_url, description } =
    await request.json();

  if (!company_id || !title || !job_url || !description) {
    return NextResponse.json(
      { error: "company_id, title, job_url, and description are required" },
      { status: 400 }
    );
  }

  if (department_tag && !DEPARTMENT_TAGS.includes(department_tag as typeof DEPARTMENT_TAGS[number])) {
    return NextResponse.json({ error: "Invalid department_tag" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find latest published snapshot, or create one
  const { data: existingSnapshot } = await admin
    .from("snapshots")
    .select("id, job_count")
    .eq("company_id", company_id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let snapshotId: string;
  let currentJobCount: number;

  if (existingSnapshot) {
    snapshotId = existingSnapshot.id;
    currentJobCount = existingSnapshot.job_count;
  } else {
    const { data: newSnapshot, error: snapError } = await admin
      .from("snapshots")
      .insert({ company_id, status: "published", job_count: 0 })
      .select("id, job_count")
      .single();

    if (snapError || !newSnapshot) {
      return NextResponse.json({ error: snapError?.message ?? "Failed to create snapshot" }, { status: 500 });
    }
    snapshotId = newSnapshot.id;
    currentJobCount = newSnapshot.job_count;
  }

  let canonical: string;
  try {
    canonical = canonicalizeUrl(job_url);
  } catch {
    return NextResponse.json({ error: "Invalid job URL" }, { status: 400 });
  }
  const job_key = generateJobKey(company_id, canonical);

  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      job_key,
      snapshot_id: snapshotId,
      company_id,
      title,
      department_tag: department_tag || "Other",
      location: location || null,
      salary_raw: salary_raw || null,
      description,
      job_url: canonical,
      first_seen_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment snapshot job_count
  const { error: countError } = await admin
    .from("snapshots")
    .update({ job_count: currentJobCount + 1 })
    .eq("id", snapshotId);

  if (countError) {
    return NextResponse.json({ error: "Job created but snapshot count update failed" }, { status: 500 });
  }

  return NextResponse.json(job);
}

export async function PATCH(request: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};
  for (const key of ["title", "department_tag", "location", "salary_raw", "job_url", "description"]) {
    if (fields[key] !== undefined) {
      updates[key] = fields[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Validate department_tag if being updated
  if (updates.department_tag && !DEPARTMENT_TAGS.includes(updates.department_tag as typeof DEPARTMENT_TAGS[number])) {
    return NextResponse.json({ error: "Invalid department_tag" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const user = await authCheck();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get job to find snapshot_id before deleting
  const { data: job } = await admin
    .from("jobs")
    .select("snapshot_id")
    .eq("id", id)
    .single();

  const { error } = await admin.from("jobs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Decrement snapshot job_count
  if (job) {
    const { data: snapshot } = await admin
      .from("snapshots")
      .select("job_count")
      .eq("id", job.snapshot_id)
      .single();

    if (snapshot) {
      const { error: countError } = await admin
        .from("snapshots")
        .update({ job_count: Math.max(0, snapshot.job_count - 1) })
        .eq("id", job.snapshot_id);

      if (countError) {
        return NextResponse.json({ error: "Job deleted but snapshot count update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
