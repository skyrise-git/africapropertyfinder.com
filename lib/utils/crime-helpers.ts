import type { CrimeStation, SafetyRating } from "@/lib/types/crime.type";

export function findStationByName(
  stations: CrimeStation[],
  name: string
): CrimeStation | undefined {
  const lower = name.toLowerCase();
  return stations.find((s) => s.station.toLowerCase() === lower);
}

export function getStationsByProvince(
  stations: CrimeStation[],
  province: string
): CrimeStation[] {
  return stations.filter((s) => s.province === province);
}

export function getStationsByDistrict(
  stations: CrimeStation[],
  district: string
): CrimeStation[] {
  return stations.filter((s) => s.district === district);
}

export function matchPropertyToStation(
  stations: CrimeStation[],
  city: string,
  state: string,
  address?: string
): CrimeStation | undefined {
  const cityLower = city.toLowerCase().trim();
  const stateLower = state.toLowerCase().trim();

  for (const station of stations) {
    if (station.station.toLowerCase() === cityLower) {
      return station;
    }
  }

  for (const station of stations) {
    const stationLower = station.station.toLowerCase();
    if (
      cityLower.includes(stationLower) ||
      stationLower.includes(cityLower)
    ) {
      if (
        station.province.toLowerCase().includes(stateLower) ||
        stateLower.includes(station.province.toLowerCase())
      ) {
        return station;
      }
    }
  }

  if (address) {
    const addrLower = address.toLowerCase();
    for (const station of stations) {
      if (addrLower.includes(station.station.toLowerCase())) {
        return station;
      }
    }
  }

  const provinceStations = stations.filter(
    (s) =>
      s.province.toLowerCase().includes(stateLower) ||
      stateLower.includes(s.province.toLowerCase())
  );

  if (provinceStations.length > 0) {
    const sorted = [...provinceStations].sort(
      (a, b) => a.crime_index - b.crime_index
    );
    return sorted[Math.floor(sorted.length / 2)];
  }

  return undefined;
}

export function getTopStations(
  stations: CrimeStation[],
  count: number,
  order: "safest" | "riskiest"
): CrimeStation[] {
  const sorted = [...stations].sort((a, b) =>
    order === "safest"
      ? b.safety_rating - a.safety_rating ||
        a.total_serious_crimes_q1_2025 - b.total_serious_crimes_q1_2025
      : b.total_serious_crimes_q1_2025 - a.total_serious_crimes_q1_2025
  );
  return sorted.slice(0, count);
}

export function getTopBreakdownCategories(
  breakdown: Record<string, number>,
  count = 6
): [string, number][] {
  return Object.entries(breakdown)
    .filter(
      ([key]) =>
        !key.includes("17 Community") &&
        !key.includes("Contact crime (Crimes against the person)") &&
        !key.includes("Property-related Crime") &&
        !key.includes("Crime detected as a result of police action") &&
        !key.includes("Other serious Crime") &&
        !key.includes("Contact-related Crime")
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
}

export function getSafetyColorClasses(rating: SafetyRating) {
  const map: Record<
    SafetyRating,
    { text: string; bg: string; border: string }
  > = {
    5: {
      text: "text-emerald-500",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/40",
    },
    4: {
      text: "text-emerald-300",
      bg: "bg-emerald-300/12",
      border: "border-emerald-300/40",
    },
    3: {
      text: "text-amber-400",
      bg: "bg-amber-400/12",
      border: "border-amber-400/40",
    },
    2: {
      text: "text-red-400",
      bg: "bg-red-400/12",
      border: "border-red-400/40",
    },
    1: {
      text: "text-red-500",
      bg: "bg-red-500/12",
      border: "border-red-500/40",
    },
  };
  return map[rating];
}
