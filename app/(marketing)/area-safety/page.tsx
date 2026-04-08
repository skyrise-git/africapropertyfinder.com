"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrimeData } from "@/contexts/crime-data-context";
import { computeProvinces, computeDistricts } from "@/lib/data/province-data";
import { ProvinceGrid } from "./_components/province-grid";
import { DistrictGrid } from "./_components/district-grid";
import { StationList } from "./_components/station-list";
import { StationDetail } from "./_components/station-detail";
import { ComparePanel } from "./_components/compare-panel";
import type { CrimeStation } from "@/lib/types/crime.type";
import {
  ChevronRight,
  Shield,
  Search,
  BarChart3,
  GitCompare,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";

type ViewLevel = "provinces" | "districts" | "stations";

export default function AreaSafetyPage() {
  const { stations, loading } = useCrimeData();
  const [activeTab, setActiveTab] = useState("explore");
  const [viewLevel, setViewLevel] = useState<ViewLevel>("provinces");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<CrimeStation | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const provinces = useMemo(() => computeProvinces(stations), [stations]);
  const districts = useMemo(
    () => (selectedProvince ? computeDistricts(stations, selectedProvince) : []),
    [stations, selectedProvince]
  );
  const stationsInDistrict = useMemo(
    () =>
      selectedDistrict
        ? stations.filter((s) => s.district === selectedDistrict)
        : [],
    [stations, selectedDistrict]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return stations
      .filter(
        (s) =>
          s.station.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.province.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [stations, searchQuery]);

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedStation(null);
    setViewLevel("districts");
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setSelectedStation(null);
    setViewLevel("stations");
  };

  const handleStationSelect = (station: CrimeStation) => {
    setSelectedStation(station);
  };

  const handleBreadcrumb = (level: ViewLevel) => {
    if (level === "provinces") {
      setSelectedProvince(null);
      setSelectedDistrict(null);
    } else if (level === "districts") {
      setSelectedDistrict(null);
    }
    setSelectedStation(null);
    setViewLevel(level);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary border border-primary/30 bg-primary/5 rounded-full px-4 py-1.5">
          <Shield className="h-3.5 w-3.5" />
          Safety Intelligence
        </div>
        <h1 className="text-3xl font-light tracking-tight sm:text-4xl">
          Area Safety Ratings
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Official SAPS crime data for {stations.length} police areas. Explore
          safety ratings, compare areas, and make informed property decisions.
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search station, district, or province..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {searchResults.length > 0 && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((s) => (
              <button
                key={s.station}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm border-b last:border-0"
                onClick={() => {
                  setSelectedStation(s);
                  setSelectedProvince(s.province);
                  setSelectedDistrict(s.district);
                  setViewLevel("stations");
                  setSearchQuery("");
                  setActiveTab("explore");
                }}
              >
                <span className="font-medium">{s.station}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {s.district}, {s.province}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="explore" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Explore
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-2">
            <GitCompare className="h-4 w-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-4 mt-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleBreadcrumb("provinces")}
            >
              All Provinces
            </Button>
            {selectedProvince && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleBreadcrumb("districts")}
                >
                  {selectedProvince}
                </Button>
              </>
            )}
            {selectedDistrict && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-medium"
                  disabled
                >
                  {selectedDistrict}
                </Button>
              </>
            )}
          </nav>

          {/* Content */}
          {viewLevel === "provinces" && (
            <ProvinceGrid
              provinces={provinces}
              onSelect={handleProvinceSelect}
            />
          )}
          {viewLevel === "districts" && (
            <DistrictGrid
              districts={districts}
              onSelect={handleDistrictSelect}
            />
          )}
          {viewLevel === "stations" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
              <StationList
                stations={stationsInDistrict}
                onSelect={handleStationSelect}
              />
              {selectedStation && (
                <StationDetail
                  station={selectedStation}
                  onClose={() => setSelectedStation(null)}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="mt-6">
          <ComparePanel />
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground border rounded-lg p-4 bg-muted/30">
        Ratings derived from SAPS official crime statistics, April–June 2025.
        Station areas ≠ individual suburbs. Use alongside other due diligence.
        Source: SAPS Crime Statistics 2025–2026 Q1 ·{" "}
        <strong className="text-primary">Africa Property Finder</strong>
      </div>
    </div>
  );
}
