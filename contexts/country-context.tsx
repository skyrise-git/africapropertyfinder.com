"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  COUNTRIES,
  SUPPORTED_COUNTRIES,
  type CountryCode,
  type CountryConfig,
  formatCompactMoney,
  formatMoney,
} from "@/lib/utils/country";

const STORAGE_KEY = "apf_country";
const GEO_COOKIE = "apf_geo_country";
const GEO_BANNER_KEY = "apf_geo_banner_dismissed";

interface CountryContextValue {
  country: CountryConfig;
  countryCode: CountryCode;
  countryName: string;
  countries: CountryConfig[];
  setCountry: (code: CountryCode) => void;
  /** True when the country was auto-set from geo and the user has not chosen yet. */
  autoDetected: boolean;
  /** True until the auto-detect banner is dismissed (only set on first auto detect). */
  showGeoBanner: boolean;
  dismissGeoBanner: () => void;
  formatMoney: (amount: number | null | undefined, suffix?: string) => string;
  formatCompactMoney: (amount: number | null | undefined) => string;
}

const defaultCountry = COUNTRIES.ZA;

const CountryContext = createContext<CountryContextValue>({
  country: defaultCountry,
  countryCode: "ZA",
  countryName: defaultCountry.name,
  countries: SUPPORTED_COUNTRIES,
  setCountry: () => {},
  autoDetected: false,
  showGeoBanner: false,
  dismissGeoBanner: () => {},
  formatMoney: (a) => formatMoney(a, "ZA"),
  formatCompactMoney: (a) => formatCompactMoney(a, "ZA"),
});

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function isSupported(code: string | null | undefined): code is CountryCode {
  return !!code && (code === "ZA" || code === "ZW");
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CountryCode>("ZA");
  const [autoDetected, setAutoDetected] = useState(false);
  const [showGeoBanner, setShowGeoBanner] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }

    if (isSupported(saved)) {
      setCode(saved);
      setAutoDetected(false);
    } else {
      const cookie = readCookie(GEO_COOKIE);
      const upper = cookie ? cookie.toUpperCase() : null;
      const resolved = isSupported(upper) ? upper : "ZA";
      setCode(resolved);
      setAutoDetected(true);
      let dismissed: string | null = null;
      try {
        dismissed = window.localStorage.getItem(GEO_BANNER_KEY);
      } catch {
        dismissed = null;
      }
      if (!dismissed) setShowGeoBanner(true);
    }

    setHydrated(true);
  }, []);

  const setCountry = useCallback((next: CountryCode) => {
    setCode(next);
    setAutoDetected(false);
    setShowGeoBanner(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.localStorage.setItem(GEO_BANNER_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const dismissGeoBanner = useCallback(() => {
    setShowGeoBanner(false);
    try {
      window.localStorage.setItem(GEO_BANNER_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<CountryContextValue>(() => {
    const cfg = COUNTRIES[code];
    return {
      country: cfg,
      countryCode: code,
      countryName: cfg.name,
      countries: SUPPORTED_COUNTRIES,
      setCountry,
      autoDetected,
      showGeoBanner: hydrated && showGeoBanner,
      dismissGeoBanner,
      formatMoney: (a, suffix) => formatMoney(a, code, suffix ? { suffix } : undefined),
      formatCompactMoney: (a) => formatCompactMoney(a, code),
    };
  }, [code, autoDetected, showGeoBanner, hydrated, setCountry, dismissGeoBanner]);

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  );
}

export function useCountry() {
  return useContext(CountryContext);
}
