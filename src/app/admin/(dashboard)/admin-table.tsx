"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export function AdminTable({ rows }: { rows: CompanyRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-2 text-xs font-medium text-gray-500">Company</th>
            <th className="pb-2 text-xs font-medium text-gray-500">Status</th>
            <th className="pb-2 text-xs font-medium text-gray-500">Last Run</th>
            <th className="pb-2 text-xs font-medium text-gray-500">Jobs</th>
            <th className="pb-2 text-xs font-medium text-gray-500">Enabled</th>
            <th className="pb-2 text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <CompanyRowItem key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompanyRowItem({ row }: { row: CompanyRow }) {
  const router = useRouter();
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlValue, setUrlValue] = useState(row.careers_url ?? "");
  const [loading, setLoading] = useState<string | null>(null);

  async function rerun() {
    setLoading("rerun");
    await fetch("/api/admin/rerun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: row.id }),
    });
    setLoading(null);
    router.refresh();
  }

  async function toggleEnabled() {
    setLoading("toggle");
    await fetch("/api/admin/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: row.id, enabled: !row.enabled }),
    });
    setLoading(null);
    router.refresh();
  }

  async function saveUrl() {
    setLoading("url");
    await fetch("/api/admin/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: row.id, careers_url: urlValue }),
    });
    setLoading(null);
    setEditingUrl(false);
    router.refresh();
  }

  const statusColor =
    row.latest_snapshot_status === "published"
      ? "text-emerald-600"
      : row.latest_snapshot_status === "failed"
        ? "text-red-600"
        : "text-gray-400";

  return (
    <>
      <tr className="border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50">
        <td className="px-1 py-3">
          <Link href={`/admin/companies/${row.id}`} className="text-sm font-medium text-black hover:underline">{row.name}</Link>
          {editingUrl ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/careers"
                className="w-64 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button
                onClick={saveUrl}
                disabled={loading === "url"}
                className="text-xs text-black transition-colors duration-150 hover:text-gray-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingUrl(false);
                  setUrlValue(row.careers_url ?? "");
                }}
                className="text-xs text-gray-400 transition-colors duration-150 hover:text-black"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingUrl(true)}
              className="mt-0.5 block truncate text-xs text-gray-400 transition-colors duration-150 hover:text-black"
              title={row.careers_url ?? "No careers page"}
            >
              {row.careers_url ?? "No careers page"}
            </button>
          )}
        </td>
        <td className="px-1 py-3">
          <span className={`text-xs font-medium ${statusColor}`}>
            {row.latest_snapshot_status ?? "—"}
          </span>
        </td>
        <td className="px-1 py-3 text-xs text-gray-500">
          {row.latest_snapshot_at
            ? new Date(row.latest_snapshot_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </td>
        <td className="px-1 py-3 text-sm text-black">
          {row.published_job_count}
        </td>
        <td className="px-1 py-3">
          <button
            onClick={toggleEnabled}
            disabled={loading === "toggle"}
            className={`text-xs font-medium transition-colors duration-150 ${
              row.enabled ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            {row.enabled ? "Yes" : "No"}
          </button>
        </td>
        <td className="px-1 py-3">
          <button
            onClick={rerun}
            disabled={loading === "rerun" || !row.careers_url}
            title={!row.careers_url ? "No careers URL configured" : undefined}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === "rerun" ? "Running..." : "Re-run"}
          </button>
        </td>
      </tr>
      {row.latest_snapshot_status === "failed" && row.latest_error && (
        <tr className="border-b border-gray-100">
          <td colSpan={6} className="px-1 py-2">
            <p className="text-xs text-red-600">{row.latest_error}</p>
          </td>
        </tr>
      )}
    </>
  );
}
