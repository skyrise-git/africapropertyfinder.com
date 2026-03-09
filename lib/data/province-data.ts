import type {
  ProvinceData,
  DistrictData,
  CrimeStation,
} from "@/lib/types/crime.type";

export function computeProvinces(stations: CrimeStation[]): ProvinceData[] {
  const grouped = new Map<string, CrimeStation[]>();
  for (const s of stations) {
    const arr = grouped.get(s.province) ?? [];
    arr.push(s);
    grouped.set(s.province, arr);
  }

  return Array.from(grouped.entries())
    .map(([name, stns]) => {
      const crimes2025 = stns.reduce(
        (sum, s) => sum + s.total_serious_crimes_q1_2025,
        0
      );
      const crimes2024 = stns.reduce(
        (sum, s) => sum + s.total_serious_crimes_q1_2024,
        0
      );
      const avgRating =
        stns.reduce((sum, s) => sum + s.safety_rating, 0) / stns.length;
      const yoyChange =
        crimes2024 > 0
          ? Math.round(((crimes2025 - crimes2024) / crimes2024) * 100)
          : 0;
      return {
        name,
        crimes2025,
        crimes2024,
        stations: stns.length,
        avgRating: +avgRating.toFixed(1),
        yoyChange,
      };
    })
    .sort((a, b) => b.avgRating - a.avgRating);
}

export function computeDistricts(
  stations: CrimeStation[],
  province?: string
): DistrictData[] {
  const filtered = province
    ? stations.filter((s) => s.province === province)
    : stations;

  const grouped = new Map<string, CrimeStation[]>();
  for (const s of filtered) {
    const key = `${s.province}|${s.district}`;
    const arr = grouped.get(key) ?? [];
    arr.push(s);
    grouped.set(key, arr);
  }

  return Array.from(grouped.entries()).map(([key, stns]) => {
    const [prov, name] = key.split("|");
    const totalCrimes2025 = stns.reduce(
      (sum, s) => sum + s.total_serious_crimes_q1_2025,
      0
    );
    const totalCrimes2024 = stns.reduce(
      (sum, s) => sum + s.total_serious_crimes_q1_2024,
      0
    );
    const avgRating =
      stns.reduce((sum, s) => sum + s.safety_rating, 0) / stns.length;
    const yoyChange =
      totalCrimes2024 > 0
        ? Math.round(((totalCrimes2025 - totalCrimes2024) / totalCrimes2024) * 100)
        : 0;
    return {
      name,
      province: prov,
      stations: stns,
      totalCrimes2025,
      totalCrimes2024,
      avgRating: +avgRating.toFixed(1),
      yoyChange,
    };
  });
}
