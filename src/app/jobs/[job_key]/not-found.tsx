import Link from "next/link";

export default function JobNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-black">
        Job Not Found
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        This job may have been removed or is no longer available.
      </p>
      <Link
        href="/jobs"
        className="mt-6 inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90"
      >
        Browse all jobs
      </Link>
    </div>
  );
}
