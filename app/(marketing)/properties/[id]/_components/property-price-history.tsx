"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import type { Property, ListingType } from "@/lib/types/property.type";
import { formatMoney as fmt, resolveCountryCode } from "@/lib/utils/country";

type Row = {
  id: string;
  price: number | null;
  rent: number | null;
  changedAt?: string;
  changed_at?: string;
};

type Props = {
  property: Property;
};

function money(
  n: number | null | undefined,
  listingType: ListingType,
  countryName?: string
) {
  if (n == null) return "—";
  const code = resolveCountryCode(countryName);
  return listingType === "sale"
    ? fmt(n, code)
    : fmt(n, code, { suffix: " / mo" });
}

function primaryAmount(p: Property, row: Row) {
  if (p.listingType === "sale") return row.price;
  return row.rent;
}

export function PropertyPriceHistory({ property }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!property.id) return;
    const supabase = createClient();
    void (async () => {
      const { data, error } = await supabase
        .from("property_price_history")
        .select("id,price,rent,changedAt")
        .eq("property_id", property.id)
        .order("changedAt", { ascending: true });

      if (error) {
        setRows([]);
      } else {
        setRows(
          ((data ?? []) as Row[]).map((r) => ({
            ...r,
            changedAt: r.changedAt ?? r.changed_at ?? "",
          }))
        );
      }
      setLoading(false);
    })();
  }, [property.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-light">
            <History className="size-5 text-primary" />
            Price history
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (rows.length <= 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-light">
            <History className="size-5 text-primary" />
            Price history
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No price changes since this listing was published. Updates to sale price or
          rent will appear here.
        </CardContent>
      </Card>
    );
  }

  const chronological = [...rows].sort(
    (a, b) =>
      new Date(a.changedAt ?? "").getTime() -
      new Date(b.changedAt ?? "").getTime()
  );

  const entries = chronological.map((row, i) => {
    const prev = i > 0 ? chronological[i - 1] : null;
    const cur = primaryAmount(property, row);
    const prevAmt = prev ? primaryAmount(property, prev) : null;
    let pct: number | null = null;
    let up: boolean | null = null;
    if (
      prevAmt != null &&
      cur != null &&
      typeof prevAmt === "number" &&
      typeof cur === "number" &&
      prevAmt !== 0
    ) {
      pct = ((cur - prevAmt) / prevAmt) * 100;
      up = cur > prevAmt;
    }
    return { row, pct, up, prevAmt };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-light">
          <History className="size-5 text-primary" />
          Price history
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {entries
            .slice()
            .reverse()
            .map(({ row, pct, up }) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-gray-100">
                    {money(
                      property.listingType === "sale" ? row.price : row.rent,
                      property.listingType,
                      property.country
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(row.changedAt ?? "").toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                {pct != null && up != null && (
                  <Badge
                    variant="secondary"
                    className="gap-1 font-normal"
                  >
                    {up ? (
                      <ArrowUpRight className="size-3.5 text-amber-600" />
                    ) : (
                      <ArrowDownRight className="size-3.5 text-emerald-600" />
                    )}
                    {up ? "+" : ""}
                    {pct.toFixed(1)}% vs previous
                  </Badge>
                )}
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
