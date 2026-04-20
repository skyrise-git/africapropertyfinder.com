"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Contact,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/hooks/use-app-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AgentStats {
  activeListings: number;
  totalListings: number;
  upcomingAppointments: number;
  totalViewings: number;
  totalViews: number;
  subscribers: number;
}

interface RecentListing {
  id: string;
  title: string;
  city: string;
  listingType: string;
  createdAt: string;
}

export function AgentDashboard() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const load = async () => {
      const supabase = createClient();

      const propsRes = await supabase
        .from("properties")
        .select("id,title,city,listingType,status,createdAt")
        .eq("userId", user.uid)
        .order("createdAt", { ascending: false });

      const props = (propsRes.data ?? []) as Array<{
        id: string;
        title: string;
        city: string;
        listingType: string;
        status?: string;
        createdAt: string;
      }>;

      const propIds = new Set(props.map((p) => p.id));
      const propIdList = [...propIds];

      const [apptsRes, apptsAllRes, viewsRes, subsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id,propertyId,date")
          .gte("date", new Date().toISOString().split("T")[0]),
        supabase.from("appointments").select("id,propertyId"),
        propIdList.length === 0
          ? Promise.resolve({ data: [] })
          : supabase
              .from("property_views")
              .select("property_id")
              .in("property_id", propIdList),
        supabase
          .from("email_subscribers")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", user.uid),
      ]);

      const ownAppts = (apptsRes.data ?? []).filter(
        (a) => a.propertyId && propIds.has(a.propertyId as string)
      );

      const ownApptsAll = (apptsAllRes.data ?? []).filter(
        (a) => a.propertyId && propIds.has(a.propertyId as string)
      );

      const viewRows = (viewsRes.data ?? []) as Array<{
        property_id: string;
      }>;
      const totalViews = viewRows.length;

      setStats({
        activeListings: props.filter(
          (p) => !p.status || p.status === "active"
        ).length,
        totalListings: props.length,
        upcomingAppointments: ownAppts.length,
        totalViewings: ownApptsAll.length,
        totalViews,
        subscribers: subsRes.count ?? 0,
      });

      setRecentListings(
        props.slice(0, 5).map((p) => ({
          id: p.id,
          title: p.title,
          city: p.city,
          listingType: p.listingType,
          createdAt: p.createdAt,
        }))
      );

      setLoading(false);
    };

    load();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-slate-700 dark:text-gray-100">
            Welcome back, {user?.name?.split(" ")[0] || "Agent"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your listings, leads, and appointments
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/create">
            <Plus className="mr-2 size-4" />
            Create Listing
          </Link>
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <Sparkles className="size-5 text-primary" />
          <p className="text-sm font-medium">
            Agent listings are <strong>free</strong> on Africa Property Finder.
            List unlimited properties at no cost.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-primary">
                {stats?.activeListings ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">
                / {stats?.totalListings ?? 0} total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              Listing views
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold text-primary">
              {stats?.totalViews ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Mail className="size-3.5" />
              Email subscribers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold text-primary">
              {stats?.subscribers ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold text-primary">
              {stats?.upcomingAppointments ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Viewing requests (all time)</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold text-primary">
              {stats?.totalViewings ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Account</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">
              Agent — Free Plan
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                <CardTitle className="text-lg font-light">
                  Recent Listings
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${user?.role}/properties`}>
                  View all
                  <ExternalLink className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentListings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Building2 className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No listings yet. Create your first one!
                </p>
                <Button size="sm" asChild>
                  <Link href="/properties/create">
                    <Plus className="mr-1 size-3" />
                    Create Listing
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/properties/${listing.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {listing.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {listing.city} &middot;{" "}
                        {listing.listingType === "sale"
                          ? "For Sale"
                          : listing.listingType === "rent"
                            ? "For Rent"
                            : "Student Housing"}
                      </p>
                    </div>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              <CardTitle className="text-lg font-light">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/properties/create">
                <Plus className="mr-2 size-4" />
                Create new listing
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/${user?.role}/appointments`}>
                <CalendarDays className="mr-2 size-4" />
                View appointments
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/${user?.role}/leads`}>
                <Contact className="mr-2 size-4" />
                View leads
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/${user?.role}/microsite`}>
                <Globe className="mr-2 size-4" />
                My micro-site
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/${user?.role}/settings`}>
                <Sparkles className="mr-2 size-4" />
                Edit agent profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
