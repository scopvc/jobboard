import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-light tracking-tight text-black">404</h1>
        <p className="mt-2 text-sm text-gray-500">Page not found.</p>
        <Link
          href="/jobs"
          className="mt-6 inline-block text-sm text-gray-400 transition-colors duration-150 hover:text-black"
        >
          Browse jobs
        </Link>
      </div>
    </div>
  );
}
