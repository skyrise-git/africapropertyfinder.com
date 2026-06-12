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
import { useCountry } from "@/contexts/country-context";
import { mapRow } from "@/lib/utils/crime-helpers";

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

export function CrimeDataProvider({ children }: { children: ReactNode }) {
  const { countryName, setCountry: setGlobalCountry, countries: globalCountries } =
    useCountry();
  const [allStations, setAllStations] = useState<CrimeStation[]>(
    cachedStations ?? []
  );
  const [loading, setLoading] = useState(!cachedStations);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(countryName);
  const fetched = useRef(false);

  // Keep crime data context in sync with the global country selection.
  useEffect(() => {
    setSelectedCountry(countryName);
  }, [countryName]);

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

  const setCountry = useCallback(
    (country: string) => {
      setSelectedCountry(country);
      const match = globalCountries.find(
        (c) => c.name.toLowerCase() === country.toLowerCase()
      );
      if (match) setGlobalCountry(match.code);
    },
    [globalCountries, setGlobalCountry]
  );

  return (
    <CrimeDataContext.Provider value={{ stations, allStations, loading, error, selectedCountry, setCountry, countries }}>
      {children}
    </CrimeDataContext.Provider>
  );
}

export function useCrimeData() {
  return useContext(CrimeDataContext);
}
