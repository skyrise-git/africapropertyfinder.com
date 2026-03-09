"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { CrimeStation } from "@/lib/types/crime.type";
import type { SafetyRating, SafetyLabel, CrimeTrend } from "@/lib/types/crime.type";

interface CrimeDataContextValue {
  stations: CrimeStation[];
  loading: boolean;
  error: string | null;
}

const CrimeDataContext = createContext<CrimeDataContextValue>({
  stations: [],
  loading: true,
  error: null,
});

let cachedStations: CrimeStation[] | null = null;

function mapRow(row: Record<string, unknown>): CrimeStation {
  return {
    station: row.station as string,
    district: row.district as string,
    province: row.province as string,
    safety_rating: row.safety_rating as SafetyRating,
    safety_label: row.safety_label as SafetyLabel,
    crime_index: Number(row.crime_index),
    total_serious_crimes_q1_2025: row.total_serious_crimes_q1_2025 as number,
    total_serious_crimes_q1_2024: row.total_serious_crimes_q1_2024 as number,
    trend: row.trend as CrimeTrend,
    crime_breakdown: (row.crime_breakdown ?? {}) as Record<string, number>,
  };
}

export function CrimeDataProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<CrimeStation[]>(
    cachedStations ?? []
  );
  const [loading, setLoading] = useState(!cachedStations);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (cachedStations || fetched.current) return;
    fetched.current = true;

    const supabase = createClient();

    supabase
      .from("crime_stations")
      .select("*")
      .order("station")
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }
        const mapped = (data ?? []).map(mapRow);
        cachedStations = mapped;
        setStations(mapped);
        setLoading(false);
      });
  }, []);

  return (
    <CrimeDataContext.Provider value={{ stations, loading, error }}>
      {children}
    </CrimeDataContext.Provider>
  );
}

export function useCrimeData() {
  return useContext(CrimeDataContext);
}
