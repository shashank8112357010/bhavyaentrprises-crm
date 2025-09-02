import { DashboardCardSkeleton, TableSkeleton } from "@/components/ui/instant-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Agents Table Skeleton */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-80" />
            </div>
            <TableSkeleton rows={5} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}