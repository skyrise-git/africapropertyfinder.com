"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DistrictData, SafetyRating } from "@/lib/types/crime.type";
import { getSafetyColorClasses } from "@/lib/utils/crime-helpers";
import { motion } from "motion/react";
import { Building2, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface DistrictGridProps {
  districts: DistrictData[];
  onSelect: (district: string) => void;
}

export function DistrictGrid({ districts, onSelect }: DistrictGridProps) {
  const sorted = [...districts].sort((a, b) => b.avgRating - a.avgRating);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((dist, idx) => {
        const rating = Math.round(dist.avgRating) as SafetyRating;
        const colors = getSafetyColorClasses(rating);

        return (
          <motion.div
            key={dist.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.3 }}
          >
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => onSelect(dist.name)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{dist.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <Badge
                    variant="outline"
                    className={`${colors.text} ${colors.bg} ${colors.border}`}
                  >
                    {dist.avgRating.toFixed(1)}/5
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {dist.stations.length} stations
                  </span>
                  <span
                    className={`text-xs font-medium flex items-center gap-0.5 ${
                      dist.yoyChange < 0
                        ? "text-emerald-500"
                        : dist.yoyChange > 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {dist.yoyChange < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : dist.yoyChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {dist.yoyChange > 0 ? "+" : ""}
                    {dist.yoyChange}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {dist.totalCrimes2025.toLocaleString()} serious crimes Q1 2025
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
