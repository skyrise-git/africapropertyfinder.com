"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CrimeStation } from "@/lib/types/crime.type";
import { TREND_CONFIG } from "@/lib/types/crime.type";
import { getSafetyColorClasses } from "@/lib/utils/crime-helpers";
import { useCrimeData } from "@/contexts/crime-data-context";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy } from "lucide-react";

export function ComparePanel() {
  const { stations } = useCrimeData();
  const [stationA, setStationA] = useState<string>("");
  const [stationB, setStationB] = useState<string>("");

  const sorted = useMemo(
    () => [...stations].sort((a, b) => a.station.localeCompare(b.station)),
    [stations]
  );
  const a = sorted.find((s) => s.station === stationA);
  const b = sorted.find((s) => s.station === stationB);

  const metrics =
    a && b
      ? [
          {
            label: "Safety Rating",
            aVal: a.safety_rating,
            bVal: b.safety_rating,
            max: 5,
            higherIsBetter: true,
          },
          {
            label: "Q1 2025 Crimes",
            aVal: a.total_serious_crimes_q1_2025,
            bVal: b.total_serious_crimes_q1_2025,
            max: Math.max(
              a.total_serious_crimes_q1_2025,
              b.total_serious_crimes_q1_2025
            ),
            higherIsBetter: false,
          },
          {
            label: "Crime Index",
            aVal: a.crime_index,
            bVal: b.crime_index,
            max: 100,
            higherIsBetter: false,
          },
        ]
      : [];

  const winner =
    a && b
      ? a.safety_rating > b.safety_rating
        ? "a"
        : b.safety_rating > a.safety_rating
          ? "b"
          : null
      : null;

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Compare Areas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Area A
            </Label>
            <Select value={stationA} onValueChange={setStationA}>
              <SelectTrigger>
                <SelectValue placeholder="Select first area..." />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((s) => (
                  <SelectItem key={s.station} value={s.station}>
                    {s.station} ({s.province})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="font-bold text-lg text-muted-foreground pb-2">VS</div>
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Area B
            </Label>
            <Select value={stationB} onValueChange={setStationB}>
              <SelectTrigger>
                <SelectValue placeholder="Select second area..." />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((s) => (
                  <SelectItem key={s.station} value={s.station}>
                    {s.station} ({s.province})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence>
          {a && b && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-[1fr_48px_1fr] gap-3">
                <StationMiniCard station={a} isWinner={winner === "a"} />
                <div className="flex items-center justify-center font-bold text-lg text-muted-foreground">
                  VS
                </div>
                <StationMiniCard station={b} isWinner={winner === "b"} />
              </div>

              <div className="space-y-3">
                {metrics.map((m) => {
                  const aPct = Math.round((m.aVal / m.max) * 100);
                  const bPct = Math.round((m.bVal / m.max) * 100);
                  const aColors = getSafetyColorClasses(a.safety_rating);
                  const bColors = getSafetyColorClasses(b.safety_rating);

                  return (
                    <div
                      key={m.label}
                      className="grid grid-cols-[1fr_80px_1fr] items-center gap-2"
                    >
                      <div className="space-y-1">
                        <div
                          className={`text-xs font-semibold text-right ${aColors.text}`}
                        >
                          {typeof m.aVal === "number" && m.aVal % 1 !== 0
                            ? m.aVal.toFixed(0)
                            : m.aVal}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full float-right"
                            style={{
                              width: `${aPct}%`,
                              backgroundColor:
                                a.safety_rating >= 4
                                  ? "rgb(16 185 129)"
                                  : a.safety_rating === 3
                                    ? "rgb(251 191 36)"
                                    : "rgb(248 113 113)",
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-center text-xs text-muted-foreground leading-tight">
                        {m.label}
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`text-xs font-semibold ${bColors.text}`}
                        >
                          {typeof m.bVal === "number" && m.bVal % 1 !== 0
                            ? m.bVal.toFixed(0)
                            : m.bVal}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${bPct}%`,
                              backgroundColor:
                                b.safety_rating >= 4
                                  ? "rgb(16 185 129)"
                                  : b.safety_rating === 3
                                    ? "rgb(251 191 36)"
                                    : "rgb(248 113 113)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function StationMiniCard({
  station,
  isWinner,
}: {
  station: CrimeStation;
  isWinner: boolean;
}) {
  const colors = getSafetyColorClasses(station.safety_rating);
  const trend = TREND_CONFIG[station.trend];

  return (
    <Card className="bg-muted/30 text-center p-4">
      {isWinner && (
        <Badge className="mb-2 bg-amber-500/20 text-amber-500 border-amber-500/40">
          <Trophy className="mr-1 h-3 w-3" />
          Safer
        </Badge>
      )}
      <div className="font-semibold text-sm">{station.station}</div>
      <div className="text-xs text-muted-foreground">{station.province}</div>
      <div className={`text-3xl font-bold mt-2 ${colors.text}`}>
        {station.safety_rating}
      </div>
      <div className={`text-xs ${colors.text}`}>{station.safety_label}</div>
      <div className={`text-xs mt-1 ${trend.color}`}>
        {trend.icon} {station.trend}
      </div>
    </Card>
  );
}
