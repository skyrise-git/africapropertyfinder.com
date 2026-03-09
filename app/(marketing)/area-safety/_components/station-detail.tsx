"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrimeStation } from "@/lib/types/crime.type";
import { TREND_CONFIG } from "@/lib/types/crime.type";
import {
  getSafetyColorClasses,
  getTopBreakdownCategories,
} from "@/lib/utils/crime-helpers";
import { CrimeDonutChart } from "./crime-donut-chart";
import { MapPin, ShieldCheck, X } from "lucide-react";
import { motion } from "motion/react";

interface StationDetailProps {
  station: CrimeStation;
  onClose: () => void;
}

const CHART_COLORS = [
  "hsl(36, 90%, 41%)",
  "hsl(160, 84%, 39%)",
  "hsl(0, 72%, 63%)",
  "hsl(160, 60%, 67%)",
  "hsl(43, 96%, 56%)",
  "hsl(237, 74%, 66%)",
];

export function StationDetail({ station, onClose }: StationDetailProps) {
  const colors = getSafetyColorClasses(station.safety_rating);
  const trend = TREND_CONFIG[station.trend];
  const topCategories = getTopBreakdownCategories(station.crime_breakdown);
  const yoyDiff =
    station.total_serious_crimes_q1_2025 -
    station.total_serious_crimes_q1_2024;
  const yoyPct =
    station.total_serious_crimes_q1_2024 > 0
      ? Math.abs(
          Math.round(
            (yoyDiff / station.total_serious_crimes_q1_2024) * 100
          )
        )
      : 0;

  const donutData = topCategories.map(([name, value], i) => ({
    name: name.length > 30 ? `${name.slice(0, 28)}…` : name,
    value,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">
                {station.station}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {station.district}, {station.province}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={`${colors.text} ${colors.bg} ${colors.border}`}
                >
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {station.safety_label} ({station.safety_rating}/5)
                </Badge>
                <Badge
                  variant="outline"
                  className={`${trend.color} bg-muted/50`}
                >
                  {trend.icon} {station.trend} · {yoyPct}% YoY
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Serious Crimes Q1 '25",
                value:
                  station.total_serious_crimes_q1_2025.toLocaleString(),
              },
              {
                label: "Serious Crimes Q1 '24",
                value:
                  station.total_serious_crimes_q1_2024.toLocaleString(),
              },
              {
                label: "Crime Index (0–100)",
                value: station.crime_index.toFixed(0),
              },
            ].map((stat) => (
              <Card key={stat.label} className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Donut Chart */}
          {donutData.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Crime Breakdown
              </h4>
              <div className="flex items-start gap-6 flex-wrap">
                <CrimeDonutChart data={donutData} />
                <div className="flex-1 space-y-2 min-w-[180px]">
                  {donutData.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-muted-foreground truncate flex-1">
                        {item.name}
                      </span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Categories Bars */}
          {topCategories.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Top Crime Categories
              </h4>
              <div className="space-y-2.5">
                {topCategories.map(([name, value], i) => {
                  const maxVal = topCategories[0][1];
                  const pct = Math.round((value / maxVal) * 100);
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-40 truncate shrink-0">
                        {name}
                      </span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[i % CHART_COLORS.length],
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.6,
                            delay: i * 0.1,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold w-8 text-right"
                        style={{
                          color: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
