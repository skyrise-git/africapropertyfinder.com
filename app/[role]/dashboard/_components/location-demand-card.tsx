"use client";

import { MapPin } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationDemandCardProps {
  topLocations: { label: string; value: number }[];
}

export function LocationDemandCard({ topLocations }: LocationDemandCardProps) {
  const barColors = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#eab308"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Top Demand Locations
        </CardTitle>
        <MapPin className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {topLocations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No location data available yet. Once properties are listed, this
            will show the hottest locations.
          </p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topLocations}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  formatter={(value: number) => [value, "Properties"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {topLocations.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={barColors[index % barColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
