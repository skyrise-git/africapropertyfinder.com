"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  LineChart,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  {
    title: "Properties",
    description: "All listings, status, featured",
    href: "/properties",
    icon: Building2,
  },
  {
    title: "Appointments",
    description: "Viewing requests",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    title: "Area safety",
    description: "Crime index by location",
    href: "/area-safety",
    icon: Shield,
  },
  {
    title: "Price estimates",
    description: "APF area estimates",
    href: "/price-estimates",
    icon: LineChart,
  },
];

export function DashboardQuickLinks() {
  const params = useParams();
  const role = params.role as string;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-slate-700 dark:text-gray-100">
          Operations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={`/${role}${item.href}`}
              className="group flex items-center justify-between rounded-lg border border-border/80 bg-card px-3 py-3 transition hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
