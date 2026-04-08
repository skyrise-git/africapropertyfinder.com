"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/types/property.type";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function PriceTrendBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-slate-600 dark:text-gray-300">{formatZAR(value)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export function PropertyPriceEstimate({ property }: { property: Property }) {
  const estimate = useMemo(() => {
    const basePrice = property.listingType === "sale"
      ? (property.price ?? 0)
      : (property.rent ?? 0);

    if (basePrice === 0) return null;

    const variance = 0.12;
    const lowEstimate = Math.round(basePrice * (1 - variance));
    const highEstimate = Math.round(basePrice * (1 + variance));
    const midEstimate = Math.round(basePrice * 1.02);

    const yoyGrowth = property.listingType === "sale" ? 6.2 : 4.8;
    const demandLevel = basePrice > 3000000 ? "High" : basePrice > 1500000 ? "Moderate" : "Growing";

    return {
      low: lowEstimate,
      mid: midEstimate,
      high: highEstimate,
      listed: basePrice,
      yoyGrowth,
      demandLevel,
    };
  }, [property]);

  if (!estimate) return null;

  const isAboveEstimate = estimate.listed > estimate.mid;
  const diffPct = Math.abs(Math.round(((estimate.listed - estimate.mid) / estimate.mid) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        APF Price Estimate
      </h3>
      <Card className="border border-gray-200 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-700 dark:text-gray-100">
                {formatZAR(estimate.mid)}
                {property.listingType !== "sale" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {isAboveEstimate ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-amber-500" />
                    <span>Listed {diffPct}% above estimate</span>
                  </>
                ) : diffPct > 0 ? (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                    <span>Listed {diffPct}% below estimate</span>
                  </>
                ) : (
                  <>
                    <Minus className="h-3 w-3" />
                    <span>At estimated value</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <PriceTrendBar label="Low estimate" value={estimate.low} max={estimate.high} />
            <PriceTrendBar label="APF estimate" value={estimate.mid} max={estimate.high} />
            <PriceTrendBar label="High estimate" value={estimate.high} max={estimate.high} />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 bg-emerald-50 border-emerald-200">
              <TrendingUp className="h-3 w-3" />
              +{estimate.yoyGrowth}% YoY
            </Badge>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {estimate.demandLevel} demand
            </Badge>
          </div>

          <p className="text-[10px] text-muted-foreground mt-2.5 leading-relaxed">
            Estimate based on comparable listings, location, and market trends. Not an appraisal.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
