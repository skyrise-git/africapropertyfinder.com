export type CountryCode = "ZA" | "ZW";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  flag: string;
  shortPrefix: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  ZA: {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    locale: "en-ZA",
    flag: "🇿🇦",
    shortPrefix: "R",
  },
  ZW: {
    code: "ZW",
    name: "Zimbabwe",
    currency: "USD",
    currencySymbol: "US$",
    locale: "en-ZW",
    flag: "🇿🇼",
    shortPrefix: "US$",
  },
};

export const SUPPORTED_COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];
export const SUPPORTED_COUNTRIES = SUPPORTED_COUNTRY_CODES.map(
  (c) => COUNTRIES[c]
);

const NAME_TO_CODE: Record<string, CountryCode> = {
  "south africa": "ZA",
  "south-africa": "ZA",
  za: "ZA",
  rsa: "ZA",
  zimbabwe: "ZW",
  zw: "ZW",
  zwe: "ZW",
};

export function resolveCountryCode(value?: string | null): CountryCode {
  if (!value) return "ZA";
  const k = value.trim().toLowerCase();
  return NAME_TO_CODE[k] ?? "ZA";
}

export function getCountryByCode(code?: string | null): CountryConfig {
  const c = (code ?? "").toUpperCase() as CountryCode;
  return COUNTRIES[c] ?? COUNTRIES.ZA;
}

/** Format a money amount in the country's currency. Falls back gracefully. */
export function formatMoney(
  amount: number | null | undefined,
  countryCode: CountryCode = "ZA",
  options?: { compact?: boolean; suffix?: string }
): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  const cfg = getCountryByCode(countryCode);
  try {
    const fmt = new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: options?.compact ? "compact" : "standard",
    });
    const out = fmt.format(amount);
    return options?.suffix ? `${out}${options.suffix}` : out;
  } catch {
    return `${cfg.currencySymbol}${Math.round(amount).toLocaleString()}${options?.suffix ?? ""}`;
  }
}

/** Compact label suitable for map markers (e.g. R1.2M, US$850K). */
export function formatCompactMoney(
  amount: number | null | undefined,
  countryCode: CountryCode = "ZA"
): string {
  if (amount == null || amount === 0) return "?";
  const cfg = getCountryByCode(countryCode);
  if (amount >= 1_000_000) return `${cfg.shortPrefix}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${cfg.shortPrefix}${(amount / 1_000).toFixed(0)}K`;
  return `${cfg.shortPrefix}${Math.round(amount)}`;
}
