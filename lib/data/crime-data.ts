import { createClient } from "@/lib/supabase/server";
import type { CrimeStation } from "@/lib/types/crime.type";
import { mapRow } from "@/lib/utils/crime-helpers";

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
