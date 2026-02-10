export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 h-8 w-48 rounded bg-gray-100" />
      <div className="mb-8 flex gap-3">
        <div className="h-7 w-32 rounded bg-gray-100" />
        <div className="h-7 w-32 rounded bg-gray-100" />
      </div>
      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 border-b border-gray-100 py-4">
            <div className="h-10 w-10 rounded bg-gray-100" />
            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-gray-100" />
              <div className="mt-2 h-3 w-32 rounded bg-gray-100" />
              <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
