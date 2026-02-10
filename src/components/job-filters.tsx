"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEPARTMENT_TAGS } from "@/lib/constants";

interface JobFiltersProps {
  currentDepartments: string[];
  currentCompanies: string[];
  companies: { slug: string; name: string }[];
  basePath?: string;
}

const Checkmark = () => (
  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
    <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDown = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-400">
    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function JobFilters({
  currentDepartments,
  currentCompanies,
  companies,
  basePath = "/jobs",
}: JobFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deptOpen, setDeptOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function replaceParams(key: string, values: string[]) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete(key);
    values.forEach((v) => sp.append(key, v));
    sp.delete("page");
    const qs = sp.toString();
    router.replace(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function toggleDepartment(tag: string) {
    const current = searchParams.getAll("department");
    const next = current.includes(tag)
      ? current.filter((d) => d !== tag)
      : [...current, tag];
    replaceParams("department", next);
  }

  function toggleCompany(slug: string) {
    const current = searchParams.getAll("company");
    const next = current.includes(slug)
      ? current.filter((c) => c !== slug)
      : [...current, slug];
    replaceParams("company", next);
  }

  const deptLabel =
    currentDepartments.length === 0
      ? "All Departments"
      : currentDepartments.length === 1
        ? currentDepartments[0]
        : `${currentDepartments.length} departments`;

  const companyLabel =
    currentCompanies.length === 0
      ? "All Companies"
      : currentCompanies.length === 1
        ? companies.find((c) => c.slug === currentCompanies[0])?.name ?? currentCompanies[0]
        : `${currentCompanies.length} companies`;

  const sortedCompanies = [...companies].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Department filter */}
      <div ref={deptRef} className="relative">
        <button
          onClick={() => setDeptOpen(!deptOpen)}
          className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          {deptLabel}
          <ChevronDown />
        </button>
        {deptOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded border border-gray-200 bg-white py-1 shadow-sm">
            <button
              onClick={() => replaceParams("department", [])}
              className="block w-full px-3 py-1.5 text-left text-xs text-gray-500 transition-colors duration-150 hover:bg-gray-50"
            >
              Clear all
            </button>
            <div className="my-1 border-t border-gray-100" />
            <div className="max-h-60 overflow-y-auto">
              {DEPARTMENT_TAGS.map((tag) => {
                const checked = currentDepartments.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleDepartment(tag)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-600 transition-colors duration-150 hover:bg-gray-50"
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                        checked
                          ? "border-black bg-black text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {checked && <Checkmark />}
                    </span>
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Company filter */}
      <div ref={companyRef} className="relative">
        <button
          onClick={() => setCompanyOpen(!companyOpen)}
          className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          {companyLabel}
          <ChevronDown />
        </button>
        {companyOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded border border-gray-200 bg-white py-1 shadow-sm">
            <button
              onClick={() => replaceParams("company", [])}
              className="block w-full px-3 py-1.5 text-left text-xs text-gray-500 transition-colors duration-150 hover:bg-gray-50"
            >
              Clear all
            </button>
            <div className="my-1 border-t border-gray-100" />
            <div className="max-h-60 overflow-y-auto">
              {sortedCompanies.map((c) => {
                const checked = currentCompanies.includes(c.slug);
                return (
                  <button
                    key={c.slug}
                    onClick={() => toggleCompany(c.slug)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-600 transition-colors duration-150 hover:bg-gray-50"
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                        checked
                          ? "border-black bg-black text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {checked && <Checkmark />}
                    </span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
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
