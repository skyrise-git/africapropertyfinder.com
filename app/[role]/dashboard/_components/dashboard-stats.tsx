"use client";

import { Building2, UserCheck, CalendarCheck2, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  loading: boolean;
  totalActiveProperties: number;
  totalActiveUsers: number;
  totalBookedProperties: number;
  totalProperties: number;
}

export function DashboardStats({
  loading,
  totalActiveProperties,
  totalActiveUsers,
  totalBookedProperties,
  totalProperties,
}: DashboardStatsProps) {
  const cards = [
    {
      label: "Active Properties",
      value: totalActiveProperties,
      icon: Building2,
    },
    {
      label: "Active Users",
      value: totalActiveUsers,
      icon: UserCheck,
    },
    {
      label: "Booked Properties",
      value: totalBookedProperties,
      icon: CalendarCheck2,
    },
    {
      label: "Total Properties",
      value: totalProperties,
      icon: Home,
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <Skeleton className="size-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
            <card.icon className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
