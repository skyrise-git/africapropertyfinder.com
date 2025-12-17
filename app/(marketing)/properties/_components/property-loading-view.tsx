import { Skeleton } from "@/components/ui/skeleton";

export function PropertyLoadingView() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      <div className="space-y-4 text-center">
        <Skeleton className="mx-auto h-10 w-64" />
        <Skeleton className="mx-auto h-5 w-80" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-72" />
          ))}
        </div>
      </div>
    </div>
  );
}

