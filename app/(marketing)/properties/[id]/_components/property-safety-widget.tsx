"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
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
import { TREND_CONFIG } from "@/lib/types/crime.type";
import type { Property } from "@/lib/types/property.type";
import type { CrimeStation, SafetyRating } from "@/lib/types/crime.type";

const RATING_CONFIG: Record<SafetyRating, { label: string; description: string; color: string; bgColor: string; borderColor: string; barColor: string }> = {
  5: { label: "Very Safe", description: "Well below national crime average", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", barColor: "bg-emerald-500" },
  4: { label: "Safe", description: "Below national crime average", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", barColor: "bg-emerald-400" },
  3: { label: "Moderate", description: "Near the national crime average", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200", barColor: "bg-amber-400" },
  2: { label: "Above Average", description: "Above the national crime average", color: "text-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200", barColor: "bg-orange-400" },
  1: { label: "High Activity", description: "Well above national crime average", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200", barColor: "bg-red-400" },
};

function getShieldIcon(rating: number, className = "h-4 w-4") {
  if (rating >= 4) return <ShieldCheck className={className} />;
  if (rating === 3) return <ShieldAlert className={className} />;
  return <Shield className={className} />;
}

function getTrendIcon(trend: string) {
  if (trend === "Improving") return <TrendingDown className="h-3.5 w-3.5" />;
  if (trend === "Worsening") return <TrendingUp className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

function getTrendLabel(trend: string) {
  if (trend === "Improving") return "Crime decreasing";
  if (trend === "Worsening") return "Crime increasing";
  return "Stable trend";
}

function SafetyCard({ station, nationalAvgIndex }: { station: CrimeStation; nationalAvgIndex: number }) {
  const config = RATING_CONFIG[station.safety_rating];
  const trend = TREND_CONFIG[station.trend];
  const vsNational = station.crime_index - nationalAvgIndex;
  const vsNationalPct = Math.abs(Math.round(vsNational));
  const isBelowNational = vsNational < 0;

  return (
    <Link href="/area-safety" className="block h-full">
      <Card className={`hover:shadow-md transition-shadow ${config.borderColor} border h-full`}>
        <CardContent className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>{getShieldIcon(station.safety_rating, "h-5 w-5")}</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-700 dark:text-gray-100">
                Crime Safety Rating
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className={`${config.color} ${config.bgColor} ${config.borderColor} text-xs`}>
                  {config.label} &middot; {station.safety_rating}/5
                </Badge>
              </div>
            </div>
          </div>

          {/* Safety scale bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Higher crime</span>
              <span>Lower crime</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full ${config.barColor} transition-all`}
                style={{ width: `${Math.max(100 - station.crime_index, 5)}%` }}
              />
              {/* National average marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-slate-400"
                style={{ left: `${Math.max(100 - nationalAvgIndex, 5)}%` }}
                title="National average"
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-muted-foreground flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {station.station}
              </span>
              <span className="text-slate-400">▲ Nat. avg</span>
            </div>
          </div>

          {/* vs National */}
          <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${isBelowNational ? "text-emerald-600" : "text-orange-500"}`}>
            <BarChart3 className="h-3.5 w-3.5" />
            {isBelowNational
              ? `${vsNationalPct} points below national average`
              : vsNationalPct === 0
                ? "At the national average"
                : `${vsNationalPct} points above national average`
            }
          </div>

          {/* Trend */}
          <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${trend.color}`}>
            {getTrendIcon(station.trend)}
            {getTrendLabel(station.trend)} year-on-year
          </div>

          {/* Description */}
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            {config.description}. Based on {station.total_serious_crimes_q1_2025.toLocaleString()} reported incidents in Q1 2025 across the {station.station} policing area.
          </p>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Source: Official crime statistics</span>
            <span className="text-[11px] text-primary font-medium">Full report &rarr;</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PropertySafetyWidget({ property }: { property: Property }) {
  const { stations, allStations, loading } = useCrimeData();

  if (loading || stations.length === 0) return null;

  const station = matchPropertyToStation(
    allStations,
    property.city,
    property.state,
    property.address,
    property.country
  );

  if (!station) return null;

  const countryStations = allStations.filter(s => s.country === station.country);
  const nationalAvgIndex = countryStations.length > 0
    ? Math.round(countryStations.reduce((sum, s) => sum + s.crime_index, 0) / countryStations.length)
    : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col h-full"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Crime Safety Index
      </h3>
      <div className="flex-1">
        <SafetyCard station={station} nationalAvgIndex={nationalAvgIndex} />
      </div>
    </motion.div>
  );
}
