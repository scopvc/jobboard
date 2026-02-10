import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex items-center justify-between pt-6">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50"
        >
          Previous
        </Link>
      ) : (
        <div />
      )}
      <span className="text-xs text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50"
        >
          Next
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
