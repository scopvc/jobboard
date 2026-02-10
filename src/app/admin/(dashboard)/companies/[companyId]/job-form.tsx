"use client";

import { useState, useCallback } from "react";
import TurndownService from "turndown";
import { DEPARTMENT_TAGS } from "@/lib/constants";
import type { Job } from "@/lib/types";

import ReactMarkdown from "react-markdown";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown>{content}</ReactMarkdown>
  );
}

interface JobFormProps {
  job?: Job;
  onSubmit: (data: JobFormData) => Promise<void>;
  onCancel: () => void;
}

export interface JobFormData {
  title: string;
  department_tag: string;
  location: string;
  salary_raw: string;
  job_url: string;
  description: string;
}

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const [title, setTitle] = useState(job?.title ?? "");
  const [departmentTag, setDepartmentTag] = useState(job?.department_tag ?? "Other");
  const [location, setLocation] = useState(job?.location ?? "");
  const [salaryRaw, setSalaryRaw] = useState(job?.salary_raw ?? "");
  const [jobUrl, setJobUrl] = useState(job?.job_url ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDescriptionPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const html = e.clipboardData.getData("text/html");
      if (html) {
        e.preventDefault();
        const markdown = turndown.turndown(html);
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue =
          description.slice(0, start) + markdown + description.slice(end);
        setDescription(newValue);
      }
    },
    [description]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ title, department_tag: departmentTag, location, salary_raw: salaryRaw, job_url: jobUrl, description });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 bg-gray-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Department</label>
          <select value={departmentTag} onChange={(e) => setDepartmentTag(e.target.value)} className={inputClass}>
            {DEPARTMENT_TAGS.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Salary</label>
          <input value={salaryRaw} onChange={(e) => setSalaryRaw(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Job URL *</label>
        <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500">Description *</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-gray-400 transition-colors duration-150 hover:text-black"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
        {showPreview ? (
          <div className="prose prose-sm prose-gray max-w-none rounded border border-gray-300 bg-white px-3 py-2">
            <MarkdownPreview content={description} />
          </div>
        ) : (
          <>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onPaste={handleDescriptionPaste}
              required
              rows={8}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              Supports Markdown. Paste rich text from a webpage and it will be converted automatically.
            </p>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded border border-gray-300 bg-black px-4 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : job ? "Save Changes" : "Add Job"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 transition-colors duration-150 hover:text-black"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
