import type { Property } from "@/lib/types/property.type";

/** Row shape returned from price_estimates (camelCase columns). */
export type PriceEstimateMatch = {
  id: string;
  country: string;
  province: string;
  city: string;
  suburb: string;
  listingType: string | null;
  propertyType: string | null;
  estimateLow: number | null;
  estimateMid: number | null;
  estimateHigh: number | null;
  yoyGrowthPct: number | null;
  demandLevel: string | null;
  priceTrend: string | null;
  forecast6m: number | null;
  forecast12m: number | null;
  forecast36m: number | null;
  source: string;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

/**
 * Pick the best matching price_estimates row for a property (client-side filter).
 */
export function pickBestPriceEstimate(
  rows: PriceEstimateMatch[],
  property: Property,
): PriceEstimateMatch | null {
  if (!rows.length) return null;
  const country = property.country ?? "South Africa";
  const province = property.state ?? "";
  const city = property.city ?? "";
  const listingType = property.listingType;

  const pool = rows.filter((r) => norm(r.country) === norm(country));
  if (!pool.length) return rows[0] ?? null;

  const byCity = pool.filter((r) => norm(r.city) === norm(city));
  const work = byCity.length ? byCity : pool;

  const byProvince = province
    ? work.filter((r) => norm(r.province) === norm(province))
    : work;
  const work2 = byProvince.length ? byProvince : work;

  const byListing = work2.filter(
    (r) => !r.listingType || r.listingType === listingType,
  );
  const work3 = byListing.length ? byListing : work2;

  return work3[0] ?? null;
}
