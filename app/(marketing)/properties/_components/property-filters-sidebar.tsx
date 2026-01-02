"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  useQueryState,
  parseAsArrayOf,
  parseAsString,
} from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  RotateCcw,
  Home,
  Building,
  GraduationCap,
  DollarSign,
  BedDouble,
  Bath,
  Sofa,
} from "lucide-react";
import type { Property, ListingType, PropertyType, FurnishingType } from "@/lib/types/property.type";
import { Separator } from "@/components/ui/separator";

interface PropertyFiltersSidebarProps {
  properties: Property[];
}

const listingTypes: { value: ListingType; label: string; icon: React.ReactNode }[] = [
  { value: "sale", label: "For Sale", icon: <Home className="h-4 w-4" /> },
  { value: "rent", label: "For Rent", icon: <Building className="h-4 w-4" /> },
  { value: "student-housing", label: "Student Housing", icon: <GraduationCap className="h-4 w-4" /> },
];

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
  { value: "other", label: "Other" },
];

const furnishingTypes: { value: FurnishingType; label: string }[] = [
  { value: "furnished", label: "Furnished" },
  { value: "semi-furnished", label: "Semi-Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

const amenities = [
  { key: "parkingAvailable", label: "Parking" },
  { key: "laundry", label: "Laundry" },
  { key: "heatingCooling", label: "Heating & Cooling" },
  { key: "balcony", label: "Balcony" },
  { key: "wifi", label: "WiFi" },
  { key: "gym", label: "Gym" },
  { key: "pool", label: "Pool" },
  { key: "elevator", label: "Elevator" },
  { key: "security", label: "Security" },
  { key: "garden", label: "Garden" },
  { key: "dishwasher", label: "Dishwasher" },
  { key: "fireplace", label: "Fireplace" },
];

export function PropertyFiltersSidebar({ properties }: PropertyFiltersSidebarProps) {
  const [selectedListingTypes, setSelectedListingTypes] = useQueryState(
    "listingTypes",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useQueryState(
    "propertyTypes",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [minPriceStr, setMinPriceStr] = useQueryState(
    "minPrice",
    parseAsString.withDefault("")
  );
  const [maxPriceStr, setMaxPriceStr] = useQueryState(
    "maxPrice",
    parseAsString.withDefault("")
  );
  const [minBedroomsStr, setMinBedroomsStr] = useQueryState(
    "minBedrooms",
    parseAsString.withDefault("")
  );
  const [minBathroomsStr, setMinBathroomsStr] = useQueryState(
    "minBathrooms",
    parseAsString.withDefault("")
  );

  const minPrice = minPriceStr ? Number(minPriceStr) : null;
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : null;
  const minBedrooms = minBedroomsStr ? Number(minBedroomsStr) : null;
  const minBathrooms = minBathroomsStr ? Number(minBathroomsStr) : null;
  const [selectedFurnishing, setSelectedFurnishing] = useQueryState(
    "furnishing",
    parseAsString.withDefault("")
  );
  const [selectedAmenities, setSelectedAmenities] = useQueryState(
    "amenities",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  // Calculate price range from properties
  const priceRange = useMemo(() => {
    const prices = properties
      .map((p) => (p.listingType === "sale" ? p.price : p.rent))
      .filter((price): price is number => typeof price === "number" && price > 0);
    return {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 1000000,
    };
  }, [properties]);

  const handleListingTypeToggle = (type: ListingType) => {
    const current = selectedListingTypes as string[];
    if (current.includes(type)) {
      setSelectedListingTypes(current.filter((t) => t !== type));
    } else {
      setSelectedListingTypes([...current, type]);
    }
  };

  const handlePropertyTypeToggle = (type: PropertyType) => {
    const current = selectedPropertyTypes as string[];
    if (current.includes(type)) {
      setSelectedPropertyTypes(current.filter((t) => t !== type));
    } else {
      setSelectedPropertyTypes([...current, type]);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    const current = selectedAmenities as string[];
    if (current.includes(amenity)) {
      setSelectedAmenities(current.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...current, amenity]);
    }
  };

  const handleResetFilters = () => {
    setSelectedListingTypes([]);
    setSelectedPropertyTypes([]);
    setMinPriceStr("");
    setMaxPriceStr("");
    setMinBedroomsStr("");
    setMinBathroomsStr("");
    setSelectedFurnishing("");
    setSelectedAmenities([]);
  };

  const hasActiveFilters =
    (selectedListingTypes as string[]).length > 0 ||
    (selectedPropertyTypes as string[]).length > 0 ||
    minPrice !== null ||
    maxPrice !== null ||
    minBedrooms !== null ||
    minBathrooms !== null ||
    selectedFurnishing !== "" ||
    (selectedAmenities as string[]).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full lg:w-80 shrink-0"
    >
      <Card className="lg:sticky lg:top-24 lg:w-[320px] border-border/60 bg-card/70 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto flex flex-col shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto flex-1">
          {/* Listing Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Listing Type</Label>
            <div className="flex flex-wrap gap-2">
              {listingTypes.map((type) => {
                const isSelected = (selectedListingTypes as string[]).includes(type.value);
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleListingTypeToggle(type.value)}
                    className="flex items-center gap-2 h-9"
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Property Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Property Type</Label>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((type) => {
                const isSelected = (selectedPropertyTypes as string[]).includes(type.value);
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePropertyTypeToggle(type.value)}
                    className="h-9 capitalize"
                  >
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </Label>
            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="min-price" className="text-xs text-muted-foreground">
                  Min Price
                </Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="Min"
                  value={minPriceStr}
                  onChange={(e) =>
                    setMinPriceStr(e.target.value || "")
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-price" className="text-xs text-muted-foreground">
                  Max Price
                </Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="Max"
                  value={maxPriceStr}
                  onChange={(e) =>
                    setMaxPriceStr(e.target.value || "")
                  }
                  className="h-9 text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Range: ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Bedrooms & Bathrooms */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Bedrooms & Bathrooms
            </Label>
            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="min-bedrooms" className="text-xs text-muted-foreground">
                  Min Bedrooms
                </Label>
                <Select
                  value={minBedroomsStr || undefined}
                  onValueChange={(value) =>
                    setMinBedroomsStr(value || "")
                  }
                >
                  <SelectTrigger id="min-bedrooms" className="h-9 text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min-bathrooms" className="text-xs text-muted-foreground">
                  Min Bathrooms
                </Label>
                <Select
                  value={minBathroomsStr || undefined}
                  onValueChange={(value) =>
                    setMinBathroomsStr(value || "")
                  }
                >
                  <SelectTrigger id="min-bathrooms" className="h-9 text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Furnishing */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Sofa className="h-4 w-4" />
              Furnishing
            </Label>
            <div className="flex flex-wrap gap-2">
              {furnishingTypes.map((type) => {
                const isSelected = selectedFurnishing === type.value;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFurnishing(isSelected ? "" : type.value)}
                    className="h-9"
                  >
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Amenities */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Amenities</Label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {amenities.map((amenity) => {
                const isSelected = (selectedAmenities as string[]).includes(amenity.key);
                return (
                  <Button
                    key={amenity.key}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAmenityToggle(amenity.key)}
                    className="h-9 w-full"
                  >
                    {amenity.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
