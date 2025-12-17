"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PropertyDetailLoading() {
  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-96 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}


