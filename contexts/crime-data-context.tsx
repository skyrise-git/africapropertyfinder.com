"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { CrimeStation } from "@/lib/types/crime.type";
import type { SafetyRating, SafetyLabel, CrimeTrend } from "@/lib/types/crime.type";

interface CrimeDataContextValue {
  stations: CrimeStation[];
  allStations: CrimeStation[];
  loading: boolean;
  error: string | null;
  selectedCountry: string;
  setCountry: (country: string) => void;
  countries: string[];
}

const CrimeDataContext = createContext<CrimeDataContextValue>({
  stations: [],
  allStations: [],
  loading: true,
  error: null,
  selectedCountry: "South Africa",
  setCountry: () => {},
  countries: [],
});

let cachedStations: CrimeStation[] | null = null;

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

export function CrimeDataProvider({ children }: { children: ReactNode }) {
  const [allStations, setAllStations] = useState<CrimeStation[]>(
    cachedStations ?? []
  );
  const [loading, setLoading] = useState(!cachedStations);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("South Africa");
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
        setAllStations(mapped);
        setLoading(false);
      });
  }, []);

  const countries = useMemo(() => {
    const unique = [...new Set(allStations.map(s => s.country))].sort();
    return unique.length > 0 ? unique : ["South Africa"];
  }, [allStations]);

  const stations = useMemo(
    () => allStations.filter(s => s.country === selectedCountry),
    [allStations, selectedCountry]
  );

  const setCountry = useCallback((country: string) => {
    setSelectedCountry(country);
  }, []);

  return (
    <CrimeDataContext.Provider value={{ stations, allStations, loading, error, selectedCountry, setCountry, countries }}>
      {children}
    </CrimeDataContext.Provider>
  );
}

export function useCrimeData() {
  return useContext(CrimeDataContext);
}
