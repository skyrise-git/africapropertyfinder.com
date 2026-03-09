"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import type { Property } from "@/lib/types/property.type";
import type { User } from "@/lib/types/user.type";
import { DashboardStats } from "./dashboard-stats";
import { FurnishingStatsCard } from "./furnishing-stats-card";
import { LocationDemandCard } from "./location-demand-card";
import {
  BookedPropertiesTable,
  RecentSalesTable,
  RecentUsersTable,
} from "./recent-tables";

type ExtendedStatus = "active" | "inactive" | "pending" | "booked" | "sold";

type PropertyWithMeta = Property & {
  status?: ExtendedStatus;
  isBooked?: boolean;
  isSold?: boolean;
};

type UserWithMeta = User & {
  status?: ExtendedStatus;
};

function parseDate(value?: string): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function AdminDashboard() {
  const {
    data: propertiesData,
    loading: propertiesLoading,
    error: propertiesError,
  } = useSupabaseRealtime<PropertyWithMeta>("properties", {
    sort: (a, b) => parseDate(b.createdAt) - parseDate(a.createdAt),
  });

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useSupabaseRealtime<UserWithMeta>("profiles");

  const properties = propertiesData ?? [];
  const users = usersData ?? [];

  const {
    activeProperties,
    bookedProperties,
    popularFurnishing,
    furnishingStats,
    topLocations,
    recentSales,
  } = useMemo(() => {
    if (!properties.length) {
      return {
        activeProperties: [] as PropertyWithMeta[],
        bookedProperties: [] as PropertyWithMeta[],
        popularFurnishing: null as string | null,
        furnishingStats: [] as { label: string; value: number }[],
        topLocations: [] as { label: string; value: number }[],
        recentSales: [] as PropertyWithMeta[],
      };
    }

    const active = properties.filter((p) => {
      const status = p.status;
      if (!status) return true;
      return status === "active";
    });

    const booked = properties.filter((p) => {
      if (p.isBooked) return true;
      if (p.status === "booked") return true;
      return false;
    });

    const furnishingCount = properties.reduce((acc, p) => {
      if (p.furnishing) {
        acc[p.furnishing] = (acc[p.furnishing] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const furnishingEntries = Object.entries(furnishingCount).map(
      ([label, value]) => ({ label, value })
    );
    const topFurnishing =
      furnishingEntries.sort((a, b) => b.value - a.value)[0]?.label ?? null;

    const locationCount = properties.reduce((acc, p) => {
      const key = p.city || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationEntries = Object.entries(locationCount)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const sales = properties
      .filter((p) => p.listingType === "sale" || p.status === "sold")
      .slice(0, 5);

    return {
      activeProperties: active,
      bookedProperties: booked,
      popularFurnishing: topFurnishing,
      furnishingStats: furnishingEntries,
      topLocations: locationEntries,
      recentSales: sales,
    };
  }, [properties]);

  const { activeUsers, recentUsers } = useMemo(() => {
    if (!users.length) {
      return {
        activeUsers: [] as UserWithMeta[],
        recentUsers: [] as UserWithMeta[],
      };
    }

    const active = users.filter((u) => u.status === "active");

    const sortedRecent = [...users].sort(
      (a, b) =>
        parseDate(b.updatedAt as string | undefined) -
        parseDate(a.updatedAt as string | undefined)
    );

    return {
      activeUsers: active,
      recentUsers: sortedRecent.slice(0, 5),
    };
  }, [users]);

  const loading = propertiesLoading || usersLoading;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {(propertiesError || usersError) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span className="break-words">
              Failed to load some analytics data. Please refresh the page.
            </span>
          </CardContent>
        </Card>
      )}

      <DashboardStats
        loading={loading}
        totalActiveProperties={activeProperties.length}
        totalActiveUsers={activeUsers.length}
        totalBookedProperties={bookedProperties.length}
        totalProperties={properties.length}
      />

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : (
          <>
            <FurnishingStatsCard
              stats={furnishingStats}
              popularFurnishing={popularFurnishing}
            />
            <LocationDemandCard topLocations={topLocations} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <RecentSalesTable loading={loading} properties={recentSales} />
        <RecentUsersTable loading={loading} users={recentUsers} />
        <BookedPropertiesTable
          loading={loading}
          properties={bookedProperties}
        />
      </div>
    </div>
  );
}
