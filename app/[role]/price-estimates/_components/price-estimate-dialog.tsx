"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type PriceEstimateRow = {
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
  historicalPrices: unknown;
  comparableCount: number | null;
  avgPricePerSqm: number | null;
  source: string;
  createdAt: string;
  updatedAt: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PriceEstimateRow | null;
  onSaved: () => void;
};

function numOrUndef(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function PriceEstimateDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const [country, setCountry] = useState("South Africa");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");
  const [listingType, setListingType] = useState<string>("");
  const [propertyType, setPropertyType] = useState("");
  const [estimateLow, setEstimateLow] = useState("");
  const [estimateMid, setEstimateMid] = useState("");
  const [estimateHigh, setEstimateHigh] = useState("");
  const [yoyGrowthPct, setYoyGrowthPct] = useState("");
  const [demandLevel, setDemandLevel] = useState("");
  const [priceTrend, setPriceTrend] = useState("");
  const [forecast6m, setForecast6m] = useState("");
  const [forecast12m, setForecast12m] = useState("");
  const [forecast36m, setForecast36m] = useState("");
  const [historicalJson, setHistoricalJson] = useState("[]");
  const [comparableCount, setComparableCount] = useState("");
  const [avgPricePerSqm, setAvgPricePerSqm] = useState("");
  const [source, setSource] = useState("manual");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCountry(initial.country);
      setProvince(initial.province);
      setCity(initial.city);
      setSuburb(initial.suburb);
      setListingType(initial.listingType ?? "");
      setPropertyType(initial.propertyType ?? "");
      setEstimateLow(initial.estimateLow != null ? String(initial.estimateLow) : "");
      setEstimateMid(initial.estimateMid != null ? String(initial.estimateMid) : "");
      setEstimateHigh(initial.estimateHigh != null ? String(initial.estimateHigh) : "");
      setYoyGrowthPct(
        initial.yoyGrowthPct != null ? String(initial.yoyGrowthPct) : "",
      );
      setDemandLevel(initial.demandLevel ?? "");
      setPriceTrend(initial.priceTrend ?? "");
      setForecast6m(initial.forecast6m != null ? String(initial.forecast6m) : "");
      setForecast12m(
        initial.forecast12m != null ? String(initial.forecast12m) : "",
      );
      setForecast36m(
        initial.forecast36m != null ? String(initial.forecast36m) : "",
      );
      setHistoricalJson(
        JSON.stringify(initial.historicalPrices ?? [], null, 2),
      );
      setComparableCount(
        initial.comparableCount != null ? String(initial.comparableCount) : "",
      );
      setAvgPricePerSqm(
        initial.avgPricePerSqm != null ? String(initial.avgPricePerSqm) : "",
      );
      setSource(initial.source || "manual");
    } else {
      setCountry("South Africa");
      setProvince("");
      setCity("");
      setSuburb("");
      setListingType("");
      setPropertyType("");
      setEstimateLow("");
      setEstimateMid("");
      setEstimateHigh("");
      setYoyGrowthPct("");
      setDemandLevel("");
      setPriceTrend("");
      setForecast6m("");
      setForecast12m("");
      setForecast36m("");
      setHistoricalJson("[]");
      setComparableCount("");
      setAvgPricePerSqm("");
      setSource("manual");
    }
  }, [open, initial]);

  const handleSave = async () => {
    let historicalPrices: Json;
    try {
      historicalPrices = JSON.parse(historicalJson || "[]") as Json;
    } catch {
      toast.error("Historical prices must be valid JSON (array or object)");
      return;
    }

    const payload = {
      country: country.trim(),
      province: province.trim() || undefined,
      city: city.trim() || undefined,
      suburb: suburb.trim(),
      listingType: listingType || undefined,
      propertyType: propertyType.trim() || undefined,
      estimateLow: numOrUndef(estimateLow),
      estimateMid: numOrUndef(estimateMid),
      estimateHigh: numOrUndef(estimateHigh),
      yoyGrowthPct: numOrUndef(yoyGrowthPct),
      demandLevel: demandLevel.trim() || undefined,
      priceTrend: priceTrend.trim() || undefined,
      forecast6m: numOrUndef(forecast6m),
      forecast12m: numOrUndef(forecast12m),
      forecast36m: numOrUndef(forecast36m),
      historicalPrices,
      comparableCount:
        comparableCount.trim() === ""
          ? undefined
          : Math.round(Number(comparableCount)) || undefined,
      avgPricePerSqm: numOrUndef(avgPricePerSqm),
      source: source.trim() || "manual",
    };

    if (!payload.city) {
      toast.error("City is required");
      return;
    }

    const supabase = createClient();
    setSaving(true);
    try {
      if (initial) {
        const { error } = await supabase
          .from("price_estimates")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("Estimate updated");
      } else {
        const { error } = await supabase.from("price_estimates").insert(payload);
        if (error) throw error;
        toast.success("Estimate created");
      }
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit price estimate" : "New price estimate"}
          </DialogTitle>
          <DialogDescription>
            Area-level APF estimates shown on listings when matched.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Province / region</Label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Suburb</Label>
              <Input value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Listing type</Label>
              <Select
                value={listingType || "__any__"}
                onValueChange={(v) =>
                  setListingType(v === "__any__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Any</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="student-housing">Student housing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Property type</Label>
              <Input
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                placeholder="e.g. apartment"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Low</Label>
              <Input value={estimateLow} onChange={(e) => setEstimateLow(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Mid</Label>
              <Input value={estimateMid} onChange={(e) => setEstimateMid(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>High</Label>
              <Input
                value={estimateHigh}
                onChange={(e) => setEstimateHigh(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>YoY growth %</Label>
              <Input
                value={yoyGrowthPct}
                onChange={(e) => setYoyGrowthPct(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Demand level</Label>
              <Input
                value={demandLevel}
                onChange={(e) => setDemandLevel(e.target.value)}
                placeholder="e.g. high"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Price trend</Label>
              <Input
                value={priceTrend}
                onChange={(e) => setPriceTrend(e.target.value)}
                placeholder="e.g. rising"
              />
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Forecast 6m</Label>
              <Input value={forecast6m} onChange={(e) => setForecast6m(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Forecast 12m</Label>
              <Input
                value={forecast12m}
                onChange={(e) => setForecast12m(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Forecast 36m</Label>
              <Input
                value={forecast36m}
                onChange={(e) => setForecast36m(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Comparable count</Label>
              <Input
                value={comparableCount}
                onChange={(e) => setComparableCount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Avg price / m²</Label>
              <Input
                value={avgPricePerSqm}
                onChange={(e) => setAvgPricePerSqm(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Historical prices (JSON)</Label>
            <Textarea
              rows={4}
              className="font-mono text-xs"
              value={historicalJson}
              onChange={(e) => setHistoricalJson(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
