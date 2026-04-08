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
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCrimeData } from "@/contexts/crime-data-context";
import { matchPropertyToStation } from "@/lib/utils/crime-helpers";
import { TREND_CONFIG } from "@/lib/types/crime.type";
import type { Property } from "@/lib/types/property.type";
import type { CrimeStation, SafetyRating } from "@/lib/types/crime.type";

const RATING_CONFIG: Record<SafetyRating, { label: string; color: string; bgColor: string; borderColor: string }> = {
  5: { label: "Very Safe", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  4: { label: "Safe", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  3: { label: "Moderate", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  2: { label: "Average", color: "text-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  1: { label: "Below Average", color: "text-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
};

function getShieldIcon(rating: number) {
  if (rating >= 4) return <ShieldCheck className="h-4 w-4" />;
  if (rating === 3) return <ShieldAlert className="h-4 w-4" />;
  return <Shield className="h-4 w-4" />;
}

function getTrendLabel(trend: string) {
  if (trend === "Improving") return "Getting safer";
  if (trend === "Worsening") return "Increasing activity";
  return "Stable area";
}

function getTrendIcon(trend: string) {
  if (trend === "Improving") return <TrendingDown className="h-3.5 w-3.5" />;
  if (trend === "Worsening") return <TrendingUp className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

function SafetyCard({ station }: { station: CrimeStation }) {
  const config = RATING_CONFIG[station.safety_rating];
  const trend = TREND_CONFIG[station.trend];

  return (
    <Link href="/area-safety" className="block">
      <Card className={`hover:shadow-md transition-shadow ${config.borderColor} border h-full`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>{getShieldIcon(station.safety_rating)}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${config.color} ${config.bgColor} ${config.borderColor} text-xs`}>
                  {config.label} &middot; {station.safety_rating}/5
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {station.station} area
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className={`flex items-center gap-1 text-xs font-medium ${trend.color}`}>
              {getTrendIcon(station.trend)}
              {getTrendLabel(station.trend)}
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>Safety insights based on SAPS quarterly statistics. <span className="text-primary font-medium">Learn more &rarr;</span></span>
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
    property.address,
    property.country
  );

  if (!station) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col h-full"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Area Insights
      </h3>
      <div className="flex-1">
        <SafetyCard station={station} />
      </div>
    </motion.div>
  );
}
