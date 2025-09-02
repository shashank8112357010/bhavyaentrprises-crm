import { DashboardCardSkeleton } from "@/components/ui/instant-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-primary/10 animate-pulse rounded" />
          <div className="h-4 w-96 bg-primary/10 animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-primary/10 animate-pulse rounded" />
      </div>
      
      {/* Dashboard cards grid skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts section skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="space-y-3">
              <div className="h-6 w-32 bg-primary/10 animate-pulse rounded" />
              <div className="h-4 w-64 bg-primary/10 animate-pulse rounded" />
              <div className="h-64 w-full bg-primary/10 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}