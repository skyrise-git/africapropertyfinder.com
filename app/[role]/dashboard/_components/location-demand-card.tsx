"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationDemandCardProps {
  topLocations: { label: string; value: number }[];
}

export function LocationDemandCard({ topLocations }: LocationDemandCardProps) {
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
          <div className="space-y-2">
            {topLocations.map((loc) => (
              <div
                key={loc.label}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="truncate">{loc.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(loc.value * 15, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {loc.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
