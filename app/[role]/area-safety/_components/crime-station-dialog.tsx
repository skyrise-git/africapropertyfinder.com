"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
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

export type CrimeStationRow = {
  id: string;
  station: string;
  district: string;
  province: string;
  safety_rating: number;
  safety_label: string;
  crime_index: number;
  total_serious_crimes_q1_2025: number;
  total_serious_crimes_q1_2024: number;
  trend: string;
  crime_breakdown: Record<string, number>;
};

const LABEL_BY_RATING: Record<number, string> = {
  5: "Very Safe",
  4: "Safe",
  3: "Moderate",
  2: "High Risk",
  1: "Very High Risk",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: CrimeStationRow | null;
  onSaved: () => void;
};

export function CrimeStationDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const [station, setStation] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [safetyRating, setSafetyRating] = useState("3");
  const [safetyLabel, setSafetyLabel] = useState("Moderate");
  const [crimeIndex, setCrimeIndex] = useState("30");
  const [crimes2025, setCrimes2025] = useState("0");
  const [crimes2024, setCrimes2024] = useState("0");
  const [trend, setTrend] = useState("Stable");
  const [breakdownJson, setBreakdownJson] = useState("{}");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setStation(initial.station);
      setDistrict(initial.district);
      setProvince(initial.province);
      setSafetyRating(String(initial.safety_rating));
      setSafetyLabel(initial.safety_label);
      setCrimeIndex(String(initial.crime_index));
      setCrimes2025(String(initial.total_serious_crimes_q1_2025));
      setCrimes2024(String(initial.total_serious_crimes_q1_2024));
      setTrend(initial.trend);
      setBreakdownJson(
        JSON.stringify(initial.crime_breakdown ?? {}, null, 2),
      );
    } else {
      setStation("");
      setDistrict("");
      setProvince("");
      setSafetyRating("3");
      setSafetyLabel(LABEL_BY_RATING[3]!);
      setCrimeIndex("30");
      setCrimes2025("0");
      setCrimes2024("0");
      setTrend("Stable");
      setBreakdownJson("{}");
    }
  }, [open, initial]);

  useEffect(() => {
    const r = Number(safetyRating);
    if (LABEL_BY_RATING[r]) setSafetyLabel(LABEL_BY_RATING[r]!);
  }, [safetyRating]);

  const handleSave = async () => {
    let breakdown: Record<string, number>;
    try {
      const parsed = JSON.parse(breakdownJson || "{}") as Record<
        string,
        unknown
      >;
      breakdown = Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, Number(v) || 0]),
      );
    } catch {
      toast.error("Crime breakdown must be valid JSON object");
      return;
    }

    const payload = {
      station: station.trim(),
      district: district.trim(),
      province: province.trim(),
      safety_rating: Number(safetyRating),
      safety_label: safetyLabel,
      crime_index: Number(crimeIndex),
      total_serious_crimes_q1_2025: Number(crimes2025),
      total_serious_crimes_q1_2024: Number(crimes2024),
      trend,
      crime_breakdown: breakdown,
    };

    if (!payload.station || !payload.district || !payload.province) {
      toast.error("Station, district, and province are required");
      return;
    }

    const supabase = createClient();
    setSaving(true);
    try {
      if (initial) {
        const { error } = await supabase
          .from("crime_stations")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("Location updated");
      } else {
        const { error } = await supabase.from("crime_stations").insert(payload);
        if (error) throw error;
        toast.success("Location added");
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
            {initial ? "Edit safety record" : "Add safety record"}
          </DialogTitle>
          <DialogDescription>
            Police station / area stats used for the public safety index.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cs-station">Station / area name</Label>
            <Input
              id="cs-station"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              placeholder="e.g. Sandton"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-2">
              <Label>District</Label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Province</Label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-2">
              <Label>Safety rating (1–5)</Label>
              <Select value={safetyRating} onValueChange={setSafetyRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} — {LABEL_BY_RATING[n]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Safety label</Label>
              <Input value={safetyLabel} readOnly className="bg-muted/50" />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="grid gap-2">
              <Label>Crime index (0–100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={crimeIndex}
                onChange={(e) => setCrimeIndex(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Serious crimes Q1 2025</Label>
              <Input
                type="number"
                min={0}
                value={crimes2025}
                onChange={(e) => setCrimes2025(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Serious crimes Q1 2024</Label>
              <Input
                type="number"
                min={0}
                value={crimes2024}
                onChange={(e) => setCrimes2024(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Trend</Label>
            <Select value={trend} onValueChange={setTrend}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Improving">Improving</SelectItem>
                <SelectItem value="Stable">Stable</SelectItem>
                <SelectItem value="Worsening">Worsening</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Crime breakdown (JSON)</Label>
            <Textarea
              rows={6}
              className="font-mono text-xs"
              value={breakdownJson}
              onChange={(e) => setBreakdownJson(e.target.value)}
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
