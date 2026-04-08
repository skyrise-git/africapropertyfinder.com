"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  LineChart,
  MessageSquare,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DashboardExtraKpis() {
  const [loading, setLoading] = useState(true);
  const [openContacts, setOpenContacts] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [crimeRows, setCrimeRows] = useState(0);
  const [estimateRows, setEstimateRows] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = addDays(today, 7);

    (async () => {
      try {
        const [cNew, cRead, appts, crime, est] = await Promise.all([
          supabase
            .from("contacts")
            .select("id", { count: "exact", head: true })
            .eq("status", "new"),
          supabase
            .from("contacts")
            .select("id", { count: "exact", head: true })
            .eq("status", "read"),
          supabase.from("appointments").select("id, date"),
          supabase
            .from("crime_stations")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("price_estimates")
            .select("id", { count: "exact", head: true }),
        ]);

        const oc =
          (cNew.count ?? 0) +
          (cRead.count ?? 0);
        setOpenContacts(oc);

        const apptRows = (appts.data ?? []) as { date: string }[];
        const upcoming = apptRows.filter(
          (r) => r.date >= today && r.date <= weekEnd,
        ).length;
        setUpcomingAppointments(upcoming);

        setCrimeRows(crime.count ?? 0);
        setEstimateRows(est.count ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      label: "Open contacts",
      value: openContacts,
      icon: MessageSquare,
      sub: "New + read",
    },
    {
      label: "Appointments (7d)",
      value: upcomingAppointments,
      icon: CalendarDays,
      sub: "Next week",
    },
    {
      label: "Safety records",
      value: crimeRows,
      icon: Shield,
      sub: "crime_stations",
    },
    {
      label: "Price estimates",
      value: estimateRows,
      icon: LineChart,
      sub: "Areas covered",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {c.label}
            </CardTitle>
            <c.icon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{c.value}</div>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
