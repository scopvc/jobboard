import Image from "next/image";
import Link from "next/link";
import type { LiveJob } from "@/lib/types";

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export function JobCard({ job }: { job: LiveJob }) {
  return (
    <div className="rounded-lg border border-gray-100 px-5 py-4 transition-all duration-150 hover:border-gray-200 hover:shadow-sm">
      <div className="flex items-start gap-4">
        <Image
          src={`/logos/${job.company_slug}.png`}
          alt={job.company_name}
          width={40}
          height={40}
          className="rounded"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-black">{job.title}</p>
          <p className="mt-0.5 text-sm text-gray-500">{job.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              {job.department_tag}
            </span>
            {job.location && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <PinIcon />
                {job.location}
              </span>
            )}
            {job.salary_raw && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <CurrencyIcon />
                {job.salary_raw}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/jobs/${job.job_key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 self-center text-xs font-medium text-gray-400 transition-colors duration-150 hover:text-black"
        >
          <span className="hidden sm:inline">Learn more</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
