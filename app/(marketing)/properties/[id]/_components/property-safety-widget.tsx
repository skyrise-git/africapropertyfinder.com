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

const VIOLENT_KEYWORDS = ["assault", "murder", "robbery", "rape", "sexual", "carjacking", "kidnapping"];
const PROPERTY_KEYWORDS = ["burglary", "theft", "shoplifting", "stock-theft", "arson", "malicious damage"];

function categoriseCrime(breakdown: Record<string, number>) {
  let violent = 0;
  let property = 0;
  let other = 0;

  for (const [key, val] of Object.entries(breakdown)) {
    const lower = key.toLowerCase();
    if (lower.includes("community") || lower.includes("contact crime") || lower.includes("property-related") || lower.includes("crime detected") || lower.includes("other serious") || lower.includes("contact-related") || lower.includes("trio")) {
      continue;
    }
    if (VIOLENT_KEYWORDS.some(kw => lower.includes(kw))) {
      violent += val;
    } else if (PROPERTY_KEYWORDS.some(kw => lower.includes(kw))) {
      property += val;
    } else {
      other += val;
    }
  }

  const total = violent + property + other;
  if (total === 0) return null;

  return {
    violent,
    property,
    other,
    total,
    violentPct: Math.round((violent / total) * 100),
    propertyPct: Math.round((property / total) * 100),
    otherPct: Math.round((other / total) * 100),
  };
}

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
  const vsNationalPct = nationalAvgIndex > 0
    ? Math.abs(Math.round(((station.crime_index - nationalAvgIndex) / nationalAvgIndex) * 100))
    : 0;
  const isBelowNational = station.crime_index < nationalAvgIndex;
  const crimes = categoriseCrime(station.crime_breakdown);

  return (
    <Link href="/area-safety" className="block h-full">
      <Card className={`hover:shadow-md transition-shadow ${config.borderColor} border h-full`}>
        <CardContent className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>{getShieldIcon(station.safety_rating, "h-5 w-5")}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-100">Crime Safety Rating</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className={`${config.color} ${config.bgColor} ${config.borderColor} text-[10px]`}>
                  {config.label} &middot; {station.safety_rating}/5
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />{station.station}
                </span>
              </div>
            </div>
          </div>

          {/* Safety bar */}
          <div className="mb-2.5">
            <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
              <span>Higher crime</span>
              <span>Lower crime</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full ${config.barColor}`}
                style={{ width: `${Math.max(100 - station.crime_index, 5)}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-slate-500"
                style={{ left: `${Math.max(100 - nationalAvgIndex, 5)}%` }}
              />
            </div>
            <div className="text-right text-[9px] text-slate-400 mt-0.5">▲ National avg</div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-2.5">
            <div className={`flex items-center gap-1 text-[11px] font-medium ${isBelowNational ? "text-emerald-600" : "text-orange-500"}`}>
              <BarChart3 className="h-3 w-3" />
              {vsNationalPct === 0
                ? "At national average"
                : isBelowNational
                  ? `${vsNationalPct}% below avg`
                  : `${vsNationalPct}% above avg`
              }
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-medium ${trend.color}`}>
              {getTrendIcon(station.trend)}
              {getTrendLabel(station.trend)}
            </div>
          </div>

          {/* Crime breakdown */}
          {crimes && (
            <div className="mb-2.5">
              <div className="text-[10px] font-medium text-slate-600 dark:text-gray-300 mb-1.5">Crime type breakdown</div>
              <div className="flex h-2 rounded-full overflow-hidden mb-1.5">
                <div className="bg-red-400" style={{ width: `${crimes.violentPct}%` }} title="Violent crimes" />
                <div className="bg-amber-400" style={{ width: `${crimes.propertyPct}%` }} title="Property crimes" />
                <div className="bg-slate-300" style={{ width: `${crimes.otherPct}%` }} title="Other" />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Violent {crimes.violentPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Property {crimes.propertyPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />Other {crimes.otherPct}%</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Q1 2025 · {station.total_serious_crimes_q1_2025.toLocaleString()} incidents</span>
            <span className="text-[10px] text-primary font-medium">Full report &rarr;</span>
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
