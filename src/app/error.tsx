"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-light tracking-tight text-black">Error</h1>
        <p className="mt-2 text-sm text-gray-500">Something went wrong.</p>
        <button
          onClick={reset}
          className="mt-6 rounded bg-black px-4 py-2 text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
