"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CrimeStation, SafetyRating } from "@/lib/types/crime.type";
import { TREND_CONFIG } from "@/lib/types/crime.type";
import { getSafetyColorClasses } from "@/lib/utils/crime-helpers";
import { motion } from "motion/react";

interface StationListProps {
  stations: CrimeStation[];
  onSelect: (station: CrimeStation) => void;
}

export function StationList({ stations, onSelect }: StationListProps) {
  const sorted = [...stations].sort(
    (a, b) => a.station.localeCompare(b.station)
  );

  return (
    <div className="space-y-2">
      {sorted.map((station, idx) => {
        const colors = getSafetyColorClasses(station.safety_rating);
        const trend = TREND_CONFIG[station.trend];

        return (
          <motion.div
            key={station.station}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.02, duration: 0.2 }}
          >
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
              onClick={() => onSelect(station)}
            >
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      station.safety_rating >= 4
                        ? "rgb(16 185 129)"
                        : station.safety_rating === 3
                          ? "rgb(251 191 36)"
                          : "rgb(248 113 113)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {station.station}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {station.district}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${colors.text} ${colors.bg} ${colors.border} shrink-0`}
                >
                  {station.safety_label}
                </Badge>
                <span className={`text-xs shrink-0 ${trend.color}`}>
                  {trend.icon} {station.trend}
                </span>
                <span className="text-xs font-medium text-muted-foreground shrink-0 w-14 text-right">
                  {station.total_serious_crimes_q1_2025.toLocaleString()}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
