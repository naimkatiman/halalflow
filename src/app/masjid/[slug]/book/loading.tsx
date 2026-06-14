export default function Loading() {
  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-10" role="status" aria-label="Memuatkan borang tempahan">
      <div className="mb-8 space-y-2">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-4 w-40 rounded" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden">
            <div className="skeleton h-32 w-full" />
            <div className="p-4 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
