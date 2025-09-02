import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// Import client components with dynamic loading for better performance
import dynamic from "next/dynamic";

// Dynamic client components (load when needed)
const DashboardClient = dynamic(() => import("./page-client"), {
  loading: () => <DashboardSkeleton />,
});


// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Server Component - loads instantly with static content
export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Static header loads immediately */}
   

      {/* Dynamic content loads after initial page render */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
