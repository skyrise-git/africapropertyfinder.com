import { marketingSite } from "@/lib/config/marketing";
import { COUNTRIES, type CountryCode } from "@/lib/utils/country";

type CountryDomainConfig = {
  code: CountryCode;
  name: string;
  currency: string;
  origin: string;
  title: string;
  description: string;
};

type MarketingSeoConfig = {
  title: string;
  description: string;
  canonical: string;
  metadataBase: string;
};

const COUNTRY_DOMAINS: Record<CountryCode, CountryDomainConfig> = {
  ZA: {
    code: "ZA",
    name: COUNTRIES.ZA.name,
    currency: COUNTRIES.ZA.currency,
    origin: "https://za.africapropertyfinder.com",
    title:
      "Property for Sale and Rent in South Africa | Africa Property Finder",
    description:
      "Find homes, apartments, land, and investment properties across South Africa with Africa Property Finder. Browse listings in ZAR and connect with trusted agents.",
  },
  ZW: {
    code: "ZW",
    name: COUNTRIES.ZW.name,
    currency: COUNTRIES.ZW.currency,
    origin: "https://zw.africapropertyfinder.com",
    title: "Property for Sale and Rent in Zimbabwe | Africa Property Finder",
    description:
      "Find homes, apartments, land, and investment properties across Zimbabwe with Africa Property Finder. Browse listings in USD and connect with trusted agents.",
  },
};

const HOST_TO_COUNTRY: Record<string, CountryCode> = {
  "za.africapropertyfinder.com": "ZA",
  "zw.africapropertyfinder.com": "ZW",
};

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0] ?? "";
}

export function getCountryCodeFromHost(host: string): CountryCode | null {
  return HOST_TO_COUNTRY[normalizeHost(host)] ?? null;
}

export function getCountryDomainConfig(code: CountryCode): CountryDomainConfig {
  return COUNTRY_DOMAINS[code];
}

export function getMarketingSeoForHost(host: string): MarketingSeoConfig {
  const code = getCountryCodeFromHost(host);

  if (!code) {
    return {
      title: marketingSite.title,
      description: marketingSite.description,
      canonical: marketingSite.url,
      metadataBase: marketingSite.url,
    };
  }

  const config = getCountryDomainConfig(code);

  return {
    title: config.title,
    description: config.description,
    canonical: config.origin,
    metadataBase: config.origin,
  };
}
