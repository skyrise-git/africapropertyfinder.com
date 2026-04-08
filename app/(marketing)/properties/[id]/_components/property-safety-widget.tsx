"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TrendingDown,
  TrendingUp,
  Minus,
  MapPin,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCrimeData } from "@/contexts/crime-data-context";
import { matchPropertyToStation } from "@/lib/utils/crime-helpers";
import { getSafetyColorClasses } from "@/lib/utils/crime-helpers";
import { TREND_CONFIG } from "@/lib/types/crime.type";
import type { Property } from "@/lib/types/property.type";
import type { CrimeStation } from "@/lib/types/crime.type";

function getShieldIcon(rating: number, className = "h-5 w-5") {
  if (rating >= 4) return <ShieldCheck className={className} />;
  if (rating === 3) return <ShieldAlert className={className} />;
  return <ShieldX className={className} />;
}

function getTrendIcon(trend: string) {
  if (trend === "Improving") return <TrendingDown className="h-4 w-4" />;
  if (trend === "Worsening") return <TrendingUp className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

function SafetyGauge({ station }: { station: CrimeStation }) {
  const colors = getSafetyColorClasses(station.safety_rating);
  const trend = TREND_CONFIG[station.trend];
  const diff = station.total_serious_crimes_q1_2025 - station.total_serious_crimes_q1_2024;
  const pct = station.total_serious_crimes_q1_2024 > 0
    ? Math.abs(Math.round((diff / station.total_serious_crimes_q1_2024) * 100))
    : 0;

  return (
    <Link href="/area-safety" className="block">
      <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: "var(--border-accent)" }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Rating circle */}
            <div className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-full border-3 ${colors.border} ${colors.bg}`}>
              <span className={`text-xl font-extrabold leading-none ${colors.text}`}>
                {station.safety_rating}
              </span>
              <span className="text-[10px] text-muted-foreground">/5</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={`${colors.text} ${colors.bg} ${colors.border} gap-1`}
                >
                  {getShieldIcon(station.safety_rating, "h-3.5 w-3.5")}
                  {station.safety_label}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${trend.color} gap-1`}
                >
                  {getTrendIcon(station.trend)}
                  {station.trend}
                  {pct > 0 && ` ${pct}%`}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {station.station} Station &middot; {station.district}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold">{station.crime_index.toFixed(0)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Crime Index</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{station.total_serious_crimes_q1_2025.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Crimes Q1 '25</div>
                </div>
                <div>
                  <div className={`text-lg font-bold flex items-center justify-center gap-1 ${trend.color}`}>
                    {getTrendIcon(station.trend)}
                    {pct > 0 ? `${pct}%` : "0%"}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">YoY Change</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              Based on SAPS Q1 2025 crime statistics
            </div>
            <span className="text-xs text-primary font-medium">View full report &rarr;</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PropertySafetyWidget({ property }: { property: Property }) {
  const { stations, loading } = useCrimeData();

  if (loading || stations.length === 0) return null;

  const station = matchPropertyToStation(
    stations,
    property.city,
    property.state,
    property.address
  );

  if (!station) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Area Safety Score
      </h3>
      <SafetyGauge station={station} />
    </motion.div>
  );
}
