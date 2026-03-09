"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, TrendingDown } from "lucide-react";

interface SafetyFilterControlsProps {
  minSafetyRating: number;
  onMinSafetyRatingChange: (value: number) => void;
  maxCrimeIndex: number;
  onMaxCrimeIndexChange: (value: number) => void;
  improvingOnly: boolean;
  onImprovingOnlyChange: (value: boolean) => void;
}

const ratingLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Any", color: "text-muted-foreground" },
  2: { label: "High Risk+", color: "text-red-400" },
  3: { label: "Moderate+", color: "text-amber-400" },
  4: { label: "Safe+", color: "text-emerald-300" },
  5: { label: "Very Safe", color: "text-emerald-500" },
};

export function SafetyFilterControls({
  minSafetyRating,
  onMinSafetyRatingChange,
  maxCrimeIndex,
  onMaxCrimeIndexChange,
  improvingOnly,
  onImprovingOnlyChange,
}: SafetyFilterControlsProps) {
  const ratingInfo = ratingLabels[minSafetyRating] ?? ratingLabels[1];

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        Area Safety
      </Label>

      {/* Min Safety Rating */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Min Safety Rating
          </Label>
          <Badge
            variant="outline"
            className={`text-xs ${ratingInfo.color}`}
          >
            {minSafetyRating}/5 · {ratingInfo.label}
          </Badge>
        </div>
        <Slider
          min={1}
          max={5}
          step={1}
          value={[minSafetyRating]}
          onValueChange={([val]) => onMinSafetyRatingChange(val)}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* Max Crime Index */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Max Crime Index
          </Label>
          <span className="text-xs font-medium">
            {maxCrimeIndex === 100 ? "Any" : `≤ ${maxCrimeIndex}`}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[maxCrimeIndex]}
          onValueChange={([val]) => onMaxCrimeIndexChange(val)}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0 (Safest)</span>
          <span>100 (Highest)</span>
        </div>
      </div>

      {/* Improving Only Toggle */}
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor="improving-only"
          className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer"
        >
          <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
          Improving areas only
        </Label>
        <Switch
          id="improving-only"
          checked={improvingOnly}
          onCheckedChange={onImprovingOnlyChange}
        />
      </div>
    </div>
  );
}
