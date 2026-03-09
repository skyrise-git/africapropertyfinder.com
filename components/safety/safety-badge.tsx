"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CrimeStation } from "@/lib/types/crime.type";
import { TREND_CONFIG } from "@/lib/types/crime.type";
import { getSafetyColorClasses } from "@/lib/utils/crime-helpers";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import Link from "next/link";

interface SafetyBadgeProps {
  station: CrimeStation;
  compact?: boolean;
}

function getShieldIcon(rating: number) {
  if (rating >= 4) return <ShieldCheck className="h-3 w-3" />;
  if (rating === 3) return <ShieldAlert className="h-3 w-3" />;
  return <ShieldX className="h-3 w-3" />;
}

export function SafetyBadge({ station, compact = false }: SafetyBadgeProps) {
  const colors = getSafetyColorClasses(station.safety_rating);
  const trend = TREND_CONFIG[station.trend];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/area-safety" className="inline-flex">
              <Badge
                variant="outline"
                className={`${colors.text} ${colors.bg} ${colors.border} gap-1 text-[10px] cursor-pointer hover:opacity-80 transition-opacity`}
              >
                {getShieldIcon(station.safety_rating)}
                {station.safety_rating}/5
              </Badge>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            <div className="space-y-1">
              <div className="font-semibold text-xs">
                {station.station} — {station.safety_label}
              </div>
              <div className="text-xs text-muted-foreground">
                Crime Index: {station.crime_index.toFixed(0)}/100
              </div>
              <div className={`text-xs ${trend.color}`}>
                {trend.icon} {station.trend} trend
              </div>
              <div className="text-xs text-muted-foreground">
                {station.total_serious_crimes_q1_2025.toLocaleString()} crimes Q1
                2025
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/area-safety" className="inline-flex">
            <Badge
              variant="outline"
              className={`${colors.text} ${colors.bg} ${colors.border} gap-1.5 cursor-pointer hover:opacity-80 transition-opacity`}
            >
              {getShieldIcon(station.safety_rating)}
              {station.safety_label}
              <span className={`${trend.color} ml-0.5`}>{trend.icon}</span>
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <div className="space-y-1">
            <div className="font-semibold text-xs">
              Nearest station: {station.station}
            </div>
            <div className="text-xs text-muted-foreground">
              Safety Rating: {station.safety_rating}/5 ·
              Crime Index: {station.crime_index.toFixed(0)}/100
            </div>
            <div className={`text-xs ${trend.color}`}>
              {trend.icon} {station.trend} · {station.total_serious_crimes_q1_2025.toLocaleString()} crimes Q1 2025
            </div>
            <div className="text-xs text-primary">Click for full safety data</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
