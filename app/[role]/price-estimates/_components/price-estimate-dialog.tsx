"use client";

import { useState } from "react";
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

// --- Custom hook to manage form state and reset logic ---
function usePriceEstimateForm(initial: PriceEstimateRow | null) {
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

  // Reset form when initial changes (only when dialog opens)
  const resetForm = () => {
    if (!initial) {
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
      return;
    }

    // Populate from initial row
    setCountry(initial.country);
    setProvince(initial.province);
    setCity(initial.city);
    setSuburb(initial.suburb);
    setListingType(initial.listingType ?? "");
    setPropertyType(initial.propertyType ?? "");
    setEstimateLow(initial.estimateLow != null ? String(initial.estimateLow) : "");
    setEstimateMid(initial.estimateMid != null ? String(initial.estimateMid) : "");
    setEstimateHigh(initial.estimateHigh != null ? String(initial.estimateHigh) : "");
    setYoyGrowthPct(initial.yoyGrowthPct != null ? String(initial.yoyGrowthPct) : "");
    setDemandLevel(initial.demandLevel ?? "");
    setPriceTrend(initial.priceTrend ?? "");
    setForecast6m(initial.forecast6m != null ? String(initial.forecast6m) : "");
    setForecast12m(initial.forecast12m != null ? String(initial.forecast12m) : "");
    setForecast36m(initial.forecast36m != null ? String(initial.forecast36m) : "");
    setHistoricalJson(JSON.stringify(initial.historicalPrices ?? [], null, 2));
    setComparableCount(initial.comparableCount != null ? String(initial.comparableCount) : "");
    setAvgPricePerSqm(initial.avgPricePerSqm != null ? String(initial.avgPricePerSqm) : "");
    setSource(initial.source || "manual");
  };

  return {
    state: {
      country, setCountry,
      province, setProvince,
      city, setCity,
      suburb, setSuburb,
      listingType, setListingType,
      propertyType, setPropertyType,
      estimateLow, setEstimateLow,
      estimateMid, setEstimateMid,
      estimateHigh, setEstimateHigh,
      yoyGrowthPct, setYoyGrowthPct,
      demandLevel, setDemandLevel,
      priceTrend, setPriceTrend,
      forecast6m, setForecast6m,
      forecast12m, setForecast12m,
      forecast36m, setForecast36m,
      historicalJson, setHistoricalJson,
      comparableCount, setComparableCount,
      avgPricePerSqm, setAvgPricePerSqm,
      source, setSource,
    },
    resetForm,
  };
}

// --- Pure helpers for save logic ---
function parseHistoricalPrices(jsonString: string): Json {
  try {
    return JSON.parse(jsonString || "[]") as Json;
  } catch {
    throw new Error("Historical prices must be valid JSON (array or object)");
  }
}

function buildPayload(formState: ReturnType<typeof usePriceEstimateForm>["state"]) {
  return {
    country: formState.country.trim(),
    province: formState.province.trim() || undefined,
    city: formState.city.trim() || undefined,
    suburb: formState.suburb.trim(),
    listingType: formState.listingType || undefined,
    propertyType: formState.propertyType.trim() || undefined,
    estimateLow: numOrUndef(formState.estimateLow),
    estimateMid: numOrUndef(formState.estimateMid),
    estimateHigh: numOrUndef(formState.estimateHigh),
    yoyGrowthPct: numOrUndef(formState.yoyGrowthPct),
    demandLevel: formState.demandLevel.trim() || undefined,
    priceTrend: formState.priceTrend.trim() || undefined,
    forecast6m: numOrUndef(formState.forecast6m),
    forecast12m: numOrUndef(formState.forecast12m),
    forecast36m: numOrUndef(formState.forecast36m),
    historicalPrices: parseHistoricalPrices(formState.historicalJson),
    comparableCount: formState.comparableCount.trim() === ""
      ? undefined
      : Math.round(Number(formState.comparableCount)) || undefined,
    avgPricePerSqm: numOrUndef(formState.avgPricePerSqm),
    source: formState.source.trim() || "manual",
  };
}

async function saveToSupabase(
  payload: any,
  initial: PriceEstimateRow | null,
  onSuccess: () => void,
  onError: (msg: string) => void,
) {
  const supabase = createClient();
  if (initial) {
    const { error } = await supabase
      .from("price_estimates")
      .update(payload)
      .eq("id", initial.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("price_estimates").insert(payload);
    if (error) throw error;
  }
  onSuccess();
}

// --- Main component ---
export function PriceEstimateDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const { state, resetForm } = usePriceEstimateForm(initial);
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens with new initial data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSave = async () => {
    let payload;
    try {
      payload = buildPayload(state);
    } catch (err: any) {
      toast.error(err.message);
      return;
    }

    if (!payload.city) {
      toast.error("City is required");
      return;
    }

    setSaving(true);
    try {
      await saveToSupabase(payload, initial, () => {
        toast.success(initial ? "Estimate updated" : "Estimate created");
        onOpenChange(false);
        onSaved();
      }, (msg) => { throw new Error(msg); });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <Input value={state.country} onChange={(e) => state.setCountry(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Province / region</Label>
              <Input value={state.province} onChange={(e) => state.setProvince(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>City</Label>
              <Input value={state.city} onChange={(e) => state.setCity(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Suburb</Label>
              <Input value={state.suburb} onChange={(e) => state.setSuburb(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Listing type</Label>
              <Select
                value={state.listingType || "__any__"}
                onValueChange={(v) => state.setListingType(v === "__any__" ? "" : v)}
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
              <Input value={state.propertyType} onChange={(e) => state.setPropertyType(e.target.value)} placeholder="e.g. apartment" />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Low</Label>
              <Input value={state.estimateLow} onChange={(e) => state.setEstimateLow(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Mid</Label>
              <Input value={state.estimateMid} onChange={(e) => state.setEstimateMid(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>High</Label>
              <Input value={state.estimateHigh} onChange={(e) => state.setEstimateHigh(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>YoY growth %</Label>
              <Input value={state.yoyGrowthPct} onChange={(e) => state.setYoyGrowthPct(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Demand level</Label>
              <Input value={state.demandLevel} onChange={(e) => state.setDemandLevel(e.target.value)} placeholder="e.g. high" />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Price trend</Label>
              <Input value={state.priceTrend} onChange={(e) => state.setPriceTrend(e.target.value)} placeholder="e.g. rising" />
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <Input value={state.source} onChange={(e) => state.setSource(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Forecast 6m</Label>
              <Input value={state.forecast6m} onChange={(e) => state.setForecast6m(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Forecast 12m</Label>
              <Input value={state.forecast12m} onChange={(e) => state.setForecast12m(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Forecast 36m</Label>
              <Input value={state.forecast36m} onChange={(e) => state.setForecast36m(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Comparable count</Label>
              <Input value={state.comparableCount} onChange={(e) => state.setComparableCount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Avg price / m²</Label>
              <Input value={state.avgPricePerSqm} onChange={(e) => state.setAvgPricePerSqm(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Historical prices (JSON)</Label>
            <Textarea rows={4} className="font-mono text-xs" value={state.historicalJson} onChange={(e) => state.setHistoricalJson(e.target.value)} />
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