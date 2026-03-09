export type SafetyRating = 1 | 2 | 3 | 4 | 5;

export type SafetyLabel =
  | "Very Safe"
  | "Safe"
  | "Moderate"
  | "High Risk"
  | "Very High Risk";

export type CrimeTrend = "Improving" | "Stable" | "Worsening";

export interface CrimeBreakdown {
  [category: string]: number;
}

export interface CrimeStation {
  station: string;
  district: string;
  province: string;
  safety_rating: SafetyRating;
  safety_label: SafetyLabel;
  crime_index: number;
  total_serious_crimes_q1_2025: number;
  total_serious_crimes_q1_2024: number;
  trend: CrimeTrend;
  crime_breakdown: CrimeBreakdown;
}

export interface ProvinceData {
  name: string;
  crimes2025: number;
  crimes2024: number;
  stations: number;
  avgRating: number;
  yoyChange: number;
}

export interface DistrictData {
  name: string;
  province: string;
  stations: CrimeStation[];
  totalCrimes2025: number;
  totalCrimes2024: number;
  avgRating: number;
  yoyChange: number;
}

export const SAFETY_COLORS: Record<
  SafetyRating,
  { fg: string; bg: string; border: string }
> = {
  5: {
    fg: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
  },
  4: {
    fg: "text-emerald-300",
    bg: "bg-emerald-300/12",
    border: "border-emerald-300/40",
  },
  3: {
    fg: "text-amber-400",
    bg: "bg-amber-400/12",
    border: "border-amber-400/40",
  },
  2: {
    fg: "text-red-400",
    bg: "bg-red-400/12",
    border: "border-red-400/40",
  },
  1: {
    fg: "text-red-500",
    bg: "bg-red-500/12",
    border: "border-red-500/40",
  },
};

export const TREND_CONFIG: Record<
  CrimeTrend,
  { icon: string; color: string }
> = {
  Improving: { icon: "↓", color: "text-emerald-500" },
  Stable: { icon: "→", color: "text-muted-foreground" },
  Worsening: { icon: "↑", color: "text-red-400" },
};
