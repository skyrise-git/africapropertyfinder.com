"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProvinceData } from "@/lib/types/crime.type";
import { getSafetyColorClasses } from "@/lib/utils/crime-helpers";
import type { SafetyRating } from "@/lib/types/crime.type";
import { motion } from "motion/react";
import { MapPin, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface ProvinceGridProps {
  provinces: ProvinceData[];
  onSelect: (province: string) => void;
}

export function ProvinceGrid({ provinces, onSelect }: ProvinceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {provinces.map((prov, idx) => {
        const rating = Math.round(prov.avgRating) as SafetyRating;
        const colors = getSafetyColorClasses(rating);

        return (
          <motion.div
            key={prov.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => onSelect(prov.name)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {prov.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colors.bg.replace("/15", "").replace("/12", "")} bg-opacity-100`}
                    style={{
                      width: `${(prov.avgRating / 5) * 100}%`,
                      backgroundColor:
                        rating >= 4
                          ? "rgb(16 185 129)"
                          : rating === 3
                            ? "rgb(251 191 36)"
                            : "rgb(248 113 113)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <div className={`font-bold ${colors.text}`}>
                      {prov.avgRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg Rating
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{prov.stations}</div>
                    <div className="text-xs text-muted-foreground">
                      Stations
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-bold flex items-center gap-0.5 ${
                        prov.yoyChange < 0
                          ? "text-emerald-500"
                          : prov.yoyChange > 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {prov.yoyChange < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : prov.yoyChange > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {prov.yoyChange > 0 ? "+" : ""}
                      {prov.yoyChange}%
                    </div>
                    <div className="text-xs text-muted-foreground">YoY</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
