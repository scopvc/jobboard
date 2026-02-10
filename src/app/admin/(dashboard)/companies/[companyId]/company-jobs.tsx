"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Job } from "@/lib/types";
import { JobForm, type JobFormData } from "./job-form";

interface CompanyJobsProps {
  companyId: string;
  jobs: Job[];
}

export function CompanyJobs({ companyId, jobs }: CompanyJobsProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(data: JobFormData) {
    let res: Response;
    try {
      res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, ...data }),
      });
    } catch {
      alert("Network error — could not reach server");
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error ?? "Failed to add job");
      return;
    }
    setAdding(false);
    router.refresh();
  }

  async function handleEdit(jobId: string, data: JobFormData) {
    let res: Response;
    try {
      res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, ...data }),
      });
    } catch {
      alert("Network error — could not reach server");
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error ?? "Failed to update job");
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(jobId: string) {
    if (!confirm("Delete this job? This cannot be undone.")) return;

    let res: Response;
    try {
      res = await fetch("/api/admin/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId }),
      });
    } catch {
      alert("Network error — could not reach server");
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error ?? "Failed to delete job");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => { setAdding(!adding); setEditingId(null); }}
          className="rounded border border-gray-300 bg-black px-4 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-gray-800"
        >
          {adding ? "Cancel" : "Add Job"}
        </button>
      </div>

      {adding && (
        <div className="mb-4">
          <JobForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2 text-xs font-medium text-gray-500">Title</th>
              <th className="pb-2 text-xs font-medium text-gray-500">Department</th>
              <th className="pb-2 text-xs font-medium text-gray-500">Location</th>
              <th className="pb-2 text-xs font-medium text-gray-500">Salary</th>
              <th className="pb-2 text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                isEditing={editingId === job.id}
                onEdit={() => { setEditingId(job.id); setAdding(false); }}
                onCancelEdit={() => setEditingId(null)}
                onSave={(data) => handleEdit(job.id, data)}
                onDelete={() => handleDelete(job.id)}
              />
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                  No jobs found. Click &quot;Add Job&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobRow({
  job,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  job: Job;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: JobFormData) => Promise<void>;
  onDelete: () => void;
}) {
  return (
    <>
      <tr className="border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50">
        <td className="px-1 py-3 text-sm text-black">{job.title}</td>
        <td className="px-1 py-3 text-xs text-gray-500">{job.department_tag}</td>
        <td className="px-1 py-3 text-xs text-gray-500">{job.location ?? "—"}</td>
        <td className="px-1 py-3 text-xs text-gray-500">{job.salary_raw ?? "—"}</td>
        <td className="px-1 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-xs text-gray-400 transition-colors duration-150 hover:text-black"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-red-400 transition-colors duration-150 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {isEditing && (
        <tr className="border-b border-gray-100">
          <td colSpan={5} className="px-1 py-3">
            <JobForm job={job} onSubmit={onSave} onCancel={onCancelEdit} />
          </td>
        </tr>
      )}
    </>
  );
}
