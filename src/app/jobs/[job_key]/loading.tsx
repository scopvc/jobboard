export default function JobDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8 h-4 w-24 rounded bg-gray-100" />
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded bg-gray-100" />
        <div>
          <div className="h-7 w-64 rounded bg-gray-100" />
          <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-5 w-20 rounded bg-gray-100" />
        <div className="h-5 w-28 rounded bg-gray-100" />
      </div>
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
        <div className="h-4 w-4/6 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-3/6 rounded bg-gray-100" />
      </div>
    </div>
  );
}
