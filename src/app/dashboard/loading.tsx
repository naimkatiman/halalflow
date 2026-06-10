import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading dashboard">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200/70 rounded-xl p-5 space-y-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200/70 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-zinc-200/70 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-100">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="p-5 space-y-3">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
