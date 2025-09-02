import { cn } from "@/lib/utils";

interface InstantSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

// Optimized skeleton component that loads instantly
export function InstantSkeleton({ className, ...props }: InstantSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/10",
        className
      )}
      {...props}
    />
  );
}

// Pre-built layout skeletons for common use cases
export function DashboardCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="space-y-3">
        <InstantSkeleton className="h-4 w-[100px]" />
        <InstantSkeleton className="h-8 w-[60px]" />
        <InstantSkeleton className="h-4 w-[140px]" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <InstantSkeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <InstantSkeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <InstantSkeleton className="h-6 w-[200px]" />
      <InstantSkeleton className="h-64 w-full" />
    </div>
  );
}