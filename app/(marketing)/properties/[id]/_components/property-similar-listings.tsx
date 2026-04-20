"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types/property.type";
import { PropertyCard } from "../../_components/property-card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  property: Property;
};

function comparableAmount(p: Property) {
  if (p.listingType === "sale") return p.price ?? null;
  return p.rent ?? null;
}

export function PropertySimilarListings({ property }: Props) {
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!property.id) return;
    const base = comparableAmount(property);
    const supabase = createClient();

    void (async () => {
      let min: number | null = null;
      let max: number | null = null;
      if (base != null && base > 0) {
        min = base * 0.7;
        max = base * 1.3;
      }

      let q = supabase
        .from("properties")
        .select("*")
        .neq("id", property.id)
        .eq("listingType", property.listingType)
        .eq("propertyType", property.propertyType)
        .eq("city", property.city)
        .limit(24);

      if (min != null && max != null) {
        if (property.listingType === "sale") {
          q = q.gte("price", min).lte("price", max);
        } else {
          q = q.gte("rent", min).lte("rent", max);
        }
      }

      const { data, error } = await q;
      let rows = ((data ?? []) as unknown as Property[]).filter(
        (p) => (p.status ?? "active") === "active"
      );

      if (rows.length < 3 && property.country) {
        const { data: data2 } = await supabase
          .from("properties")
          .select("*")
          .neq("id", property.id)
          .eq("listingType", property.listingType)
          .eq("country", property.country)
          .limit(24);

        const extra = ((data2 ?? []) as unknown as Property[]).filter(
          (p) => (p.status ?? "active") === "active"
        );
        const seen = new Set(rows.map((r) => r.id));
        for (const p of extra) {
          if (!seen.has(p.id)) {
            rows.push(p);
            seen.add(p.id);
          }
        }
      }

      if (error) {
        setList([]);
        setLoading(false);
        return;
      }

      const scored = rows
        .map((p) => {
          const a = comparableAmount(p);
          const dist =
            base != null && a != null ? Math.abs(a - base) : Number.MAX_VALUE;
          return { p, dist };
        })
        .sort((x, y) => x.dist - y.dist)
        .slice(0, 6)
        .map((x) => x.p);

      setList(scored);
      setLoading(false);
    })();
  }, [property]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (list.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-light tracking-tight text-slate-700 dark:text-gray-100">
        Similar properties
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {list.map((p) => (
          <div key={p.id} className="w-[min(100%,320px)] shrink-0">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
