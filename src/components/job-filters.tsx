"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEPARTMENT_TAGS } from "@/lib/constants";

interface JobFiltersProps {
  currentDepartments: string[];
  currentCompany: string | null;
  currentSearch: string;
  companies: { slug: string; name: string }[];
  basePath?: string;
}

export function JobFilters({
  currentDepartments,
  currentCompany,
  currentSearch,
  companies,
  basePath = "/jobs",
}: JobFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(currentSearch);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keep local search in sync with URL when navigating
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  const buildUrl = useCallback(
    (params: {
      departments?: string[];
      company?: string | null;
      q?: string;
    }) => {
      const sp = new URLSearchParams();
      const depts =
        params.departments !== undefined
          ? params.departments
          : currentDepartments;
      const comp =
        params.company !== undefined ? params.company : currentCompany;
      const q = params.q !== undefined ? params.q : currentSearch;
      depts.forEach((d) => sp.append("department", d));
      if (comp) sp.set("company", comp);
      if (q) sp.set("q", q);
      const qs = sp.toString();
      return `${basePath}${qs ? `?${qs}` : ""}`;
    },
    [currentDepartments, currentCompany, currentSearch, basePath]
  );

  function navigate(params: {
    departments?: string[];
    company?: string | null;
    q?: string;
  }) {
    router.replace(buildUrl(params), { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ q: value });
    }, 300);
  }

  function toggleDepartment(tag: string) {
    const next = currentDepartments.includes(tag)
      ? currentDepartments.filter((d) => d !== tag)
      : [...currentDepartments, tag];
    navigate({ departments: next });
  }

  const deptLabel =
    currentDepartments.length === 0
      ? "All Departments"
      : currentDepartments.length === 1
        ? currentDepartments[0]
        : `${currentDepartments.length} departments`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Department filter */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          {deptLabel}
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-400">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded border border-gray-200 bg-white py-1 shadow-sm">
            <button
              onClick={() => navigate({ departments: [] })}
              className="block w-full px-3 py-1.5 text-left text-xs text-gray-500 transition-colors duration-150 hover:bg-gray-50"
            >
              Clear all
            </button>
            <div className="my-1 border-t border-gray-100" />
            {DEPARTMENT_TAGS.map((tag) => {
              const checked = currentDepartments.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleDepartment(tag)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-600 transition-colors duration-150 hover:bg-gray-50"
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                      checked
                        ? "border-black bg-black text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Company filter */}
      <select
        value={currentCompany ?? ""}
        onChange={(e) => navigate({ company: e.target.value || null })}
        className="appearance-none rounded border border-gray-300 bg-white py-2.5 pl-4 pr-9 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_6px] bg-[position:right_12px_center] bg-no-repeat"
      >
        <option value="">All Companies</option>
        {companies.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface JobSearchProps {
  currentSearch: string;
  basePath?: string;
}

export function JobSearch({ currentSearch, basePath = "/jobs" }: JobSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only sync from prop when the input is NOT focused (user not typing)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setSearchValue(currentSearch);
    }
  }, [currentSearch]);

  function submitSearch(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      sp.set("q", value.trim());
    } else {
      sp.delete("q");
    }
    sp.delete("page");
    const qs = sp.toString();
    router.replace(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      submitSearch(value);
    }, 500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      submitSearch(searchValue);
    }
  }

  return (
    <div className="relative">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search title, company, location, or keyword..."
        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-600 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </div>
  );
}
