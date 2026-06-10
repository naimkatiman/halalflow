import { Skeleton } from '@/components/ui/Skeleton';

export default function WorkflowsLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading workflows">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-lg" />
        ))}
      </div>

      <div className="bg-white border border-zinc-200/70 rounded-xl divide-y divide-zinc-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
