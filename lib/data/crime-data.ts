import { createClient } from "@/lib/supabase/server";
import type { CrimeStation, SafetyRating, SafetyLabel, CrimeTrend } from "@/lib/types/crime.type";

function mapRow(row: Record<string, unknown>): CrimeStation {
  return {
    station: row.station as string,
    district: row.district as string,
    province: row.province as string,
    country: (row.country as string) ?? "South Africa",
    safety_rating: row.safety_rating as SafetyRating,
    safety_label: row.safety_label as SafetyLabel,
    crime_index: Number(row.crime_index),
    total_serious_crimes_q1_2025: row.total_serious_crimes_q1_2025 as number,
    total_serious_crimes_q1_2024: row.total_serious_crimes_q1_2024 as number,
    trend: row.trend as CrimeTrend,
    crime_breakdown: (row.crime_breakdown ?? {}) as Record<string, number>,
  };
}

export async function fetchCrimeStations(): Promise<CrimeStation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crime_stations")
    .select("*")
    .order("station");

  if (error) {
    console.error("Failed to fetch crime stations:", error.message);
    return [];
  }

  return (data ?? []).map(mapRow);
}
