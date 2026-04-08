"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useQueryState, parseAsArrayOf, parseAsString } from "nuqs";
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
  Sofa,
  Building2,
  DoorOpen,
  Square,
  Package,
  Car,
  Shirt,
  ThermometerSun,
  Sun,
  Wifi,
  Dumbbell,
  Waves,
  ArrowUpDown,
  Shield,
  Sprout,
  ChefHat,
  Flame,
  MapPin,
  Ruler,
  PawPrint,
  Cigarette,
  Users,
  Train,
  Star,
  CalendarClock,
} from "lucide-react";
import { SafetyFilterControls } from "@/components/safety/safety-filter-controls";
import type {
  Property,
  ListingType,
  PropertyType,
  FurnishingType,
} from "@/lib/types/property.type";
import { Separator } from "@/components/ui/separator";

interface PropertyFiltersSidebarProps {
  properties: Property[];
}

const listingTypes: {
  value: ListingType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "sale", label: "For Sale", icon: <Home className="h-4 w-4" /> },
  { value: "rent", label: "For Rent", icon: <Building className="h-4 w-4" /> },
  {
    value: "student-housing",
    label: "Student Housing",
    icon: <GraduationCap className="h-4 w-4" />,
  },
];

const propertyTypes: {
  value: PropertyType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "apartment",
    label: "Apartment",
    icon: <Building2 className="h-4 w-4" />,
  },
  { value: "house", label: "House", icon: <Home className="h-4 w-4" /> },
  { value: "condo", label: "Condo", icon: <Building2 className="h-4 w-4" /> },
  {
    value: "townhouse",
    label: "Townhouse",
    icon: <Building className="h-4 w-4" />,
  },
  { value: "studio", label: "Studio", icon: <Square className="h-4 w-4" /> },
  { value: "room", label: "Room", icon: <DoorOpen className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <Package className="h-4 w-4" /> },
];

const furnishingTypes: {
  value: FurnishingType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "furnished",
    label: "Furnished",
    icon: <Sofa className="h-4 w-4" />,
  },
  {
    value: "semi-furnished",
    label: "Semi-Furnished",
    icon: <Package className="h-4 w-4" />,
  },
  {
    value: "unfurnished",
    label: "Unfurnished",
    icon: <Square className="h-4 w-4" />,
  },
];

const amenities = [
  {
    key: "parkingAvailable",
    label: "Parking",
    icon: <Car className="h-4 w-4" />,
  },
  { key: "laundry", label: "Laundry", icon: <Shirt className="h-4 w-4" /> },
  {
    key: "heatingCooling",
    label: "Heating & Cooling",
    icon: <ThermometerSun className="h-4 w-4" />,
  },
  { key: "balcony", label: "Balcony", icon: <Sun className="h-4 w-4" /> },
  { key: "wifi", label: "WiFi", icon: <Wifi className="h-4 w-4" /> },
  { key: "gym", label: "Gym", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "pool", label: "Pool", icon: <Waves className="h-4 w-4" /> },
  {
    key: "elevator",
    label: "Elevator",
    icon: <ArrowUpDown className="h-4 w-4" />,
  },
  { key: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { key: "garden", label: "Garden", icon: <Sprout className="h-4 w-4" /> },
  {
    key: "dishwasher",
    label: "Dishwasher",
    icon: <ChefHat className="h-4 w-4" />,
  },
  { key: "fireplace", label: "Fireplace", icon: <Flame className="h-4 w-4" /> },
];

export function PropertyFiltersSidebar({
  properties,
}: PropertyFiltersSidebarProps) {
  const [selectedCountry, setSelectedCountry] = useQueryState(
    "country",
    parseAsString.withDefault("")
  );
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
  const [keywordSearch, setKeywordSearch] = useQueryState(
    "keyword",
    parseAsString.withDefault("")
  );
  const [selectedCity, setSelectedCity] = useQueryState(
    "city",
    parseAsString.withDefault("")
  );
  const [selectedProvince, setSelectedProvince] = useQueryState(
    "province",
    parseAsString.withDefault("")
  );
  const [minAreaStr, setMinAreaStr] = useQueryState(
    "minArea",
    parseAsString.withDefault("")
  );
  const [maxAreaStr, setMaxAreaStr] = useQueryState(
    "maxArea",
    parseAsString.withDefault("")
  );
  const [petsAllowed, setPetsAllowed] = useQueryState(
    "pets",
    parseAsString.withDefault("")
  );
  const [smokingAllowed, setSmokingAllowed] = useQueryState(
    "smoking",
    parseAsString.withDefault("")
  );
  const [guestsAllowed, setGuestsAllowed] = useQueryState(
    "guests",
    parseAsString.withDefault("")
  );
  const [nearTransit, setNearTransit] = useQueryState(
    "transit",
    parseAsString.withDefault("")
  );
  const [featuredOnly, setFeaturedOnly] = useQueryState(
    "featured",
    parseAsString.withDefault("")
  );
  const [dateListed, setDateListed] = useQueryState(
    "listed",
    parseAsString.withDefault("")
  );
  const [minSafetyRatingStr, setMinSafetyRatingStr] = useQueryState(
    "minSafety",
    parseAsString.withDefault("1")
  );
  const [maxCrimeIndexStr, setMaxCrimeIndexStr] = useQueryState(
    "maxCrime",
    parseAsString.withDefault("100")
  );
  const [improvingOnlyStr, setImprovingOnlyStr] = useQueryState(
    "improvingOnly",
    parseAsString.withDefault("false")
  );

  const minSafetyRating = Number(minSafetyRatingStr) || 1;
  const maxCrimeIndex = Number(maxCrimeIndexStr) || 100;
  const improvingOnly = improvingOnlyStr === "true";

  const provinces = useMemo(() => {
    const s = new Set(properties.map((p) => p.state).filter(Boolean));
    return [...s].sort();
  }, [properties]);

  const cities = useMemo(() => {
    let pool = properties;
    if (selectedProvince) pool = pool.filter((p) => p.state === selectedProvince);
    const s = new Set(pool.map((p) => p.city).filter(Boolean));
    return [...s].sort();
  }, [properties, selectedProvince]);

  const priceRange = useMemo(() => {
    const prices = properties
      .map((p) => (p.listingType === "sale" ? p.price : p.rent))
      .filter(
        (price): price is number => typeof price === "number" && price > 0
      );
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
    setSelectedCountry("");
    setSelectedListingTypes([]);
    setSelectedPropertyTypes([]);
    setMinPriceStr("");
    setMaxPriceStr("");
    setMinBedroomsStr("");
    setMinBathroomsStr("");
    setSelectedFurnishing("");
    setSelectedAmenities([]);
    setKeywordSearch("");
    setSelectedCity("");
    setSelectedProvince("");
    setMinAreaStr("");
    setMaxAreaStr("");
    setPetsAllowed("");
    setSmokingAllowed("");
    setGuestsAllowed("");
    setNearTransit("");
    setFeaturedOnly("");
    setDateListed("");
    setMinSafetyRatingStr("1");
    setMaxCrimeIndexStr("100");
    setImprovingOnlyStr("false");
  };

  const hasActiveFilters =
    selectedCountry !== "" ||
    (selectedListingTypes as string[]).length > 0 ||
    (selectedPropertyTypes as string[]).length > 0 ||
    minPrice !== null ||
    maxPrice !== null ||
    minBedrooms !== null ||
    minBathrooms !== null ||
    selectedFurnishing !== "" ||
    (selectedAmenities as string[]).length > 0 ||
    keywordSearch !== "" ||
    selectedCity !== "" ||
    selectedProvince !== "" ||
    minAreaStr !== "" ||
    maxAreaStr !== "" ||
    petsAllowed === "true" ||
    smokingAllowed === "true" ||
    guestsAllowed === "true" ||
    nearTransit === "true" ||
    featuredOnly === "true" ||
    dateListed !== "" ||
    minSafetyRating > 1 ||
    maxCrimeIndex < 100 ||
    improvingOnly;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full lg:w-80 shrink-0"
    >
      <Card className="lg:w-[320px] border-border/60 bg-card/70 flex flex-col shadow-lg h-auto">
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
        <CardContent className="space-y-6 h-auto">
          {/* Country */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Country</Label>
            <Select
              value={selectedCountry || "all"}
              onValueChange={(val) => setSelectedCountry(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="South Africa">South Africa</SelectItem>
                <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Province */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Province / Region
            </Label>
            <Select
              value={selectedProvince || "all"}
              onValueChange={(val) => {
                setSelectedProvince(val === "all" ? "" : val);
                if (val === "all") setSelectedCity("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {provinces.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">City / Town</Label>
            <Select
              value={selectedCity || "all"}
              onValueChange={(val) => setSelectedCity(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Listing Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Listing Type</Label>
            <div className="flex flex-wrap gap-2">
              {listingTypes.map((type) => {
                const isSelected = (selectedListingTypes as string[]).includes(
                  type.value
                );
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
                const isSelected = (selectedPropertyTypes as string[]).includes(
                  type.value
                );
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePropertyTypeToggle(type.value)}
                    className="h-9 capitalize flex items-center gap-2"
                  >
                    {type.icon}
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
                <Label
                  htmlFor="min-price"
                  className="text-xs text-muted-foreground"
                >
                  Min Price
                </Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="Min"
                  value={minPriceStr}
                  onChange={(e) => setMinPriceStr(e.target.value || "")}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="max-price"
                  className="text-xs text-muted-foreground"
                >
                  Max Price
                </Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="Max"
                  value={maxPriceStr}
                  onChange={(e) => setMaxPriceStr(e.target.value || "")}
                  className="h-9 text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Range: ${priceRange.min.toLocaleString()} - $
                {priceRange.max.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Bedrooms */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Beds</Label>
            <div className="flex flex-wrap gap-1.5">
              {["", "0", "1", "2", "3", "4", "5"].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant={minBedroomsStr === val ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setMinBedroomsStr(val)}
                >
                  {val === "" ? "Any" : val === "0" ? "Studio" : `${val}+`}
                </Button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Baths</Label>
            <div className="flex flex-wrap gap-1.5">
              {["", "1", "2", "3", "4"].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant={minBathroomsStr === val ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setMinBathroomsStr(val)}
                >
                  {val === "" ? "Any" : `${val}+`}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Keyword Search */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Keyword</Label>
            <Input
              type="text"
              placeholder="e.g. pool, garden, ocean view"
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <Separator />

          {/* Area / Size */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Area (m²)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="min-area" className="text-xs text-muted-foreground">Min</Label>
                <Input
                  id="min-area"
                  type="number"
                  placeholder="0"
                  value={minAreaStr}
                  onChange={(e) => setMinAreaStr(e.target.value || "")}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-area" className="text-xs text-muted-foreground">Max</Label>
                <Input
                  id="max-area"
                  type="number"
                  placeholder="Any"
                  value={maxAreaStr}
                  onChange={(e) => setMaxAreaStr(e.target.value || "")}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Policies */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Policies</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={petsAllowed === "true" ? "default" : "outline"}
                size="sm"
                className="h-9 flex items-center gap-2"
                onClick={() => setPetsAllowed(petsAllowed === "true" ? "" : "true")}
              >
                <PawPrint className="h-4 w-4" />
                Pets OK
              </Button>
              <Button
                type="button"
                variant={smokingAllowed === "true" ? "default" : "outline"}
                size="sm"
                className="h-9 flex items-center gap-2"
                onClick={() => setSmokingAllowed(smokingAllowed === "true" ? "" : "true")}
              >
                <Cigarette className="h-4 w-4" />
                Smoking OK
              </Button>
              <Button
                type="button"
                variant={guestsAllowed === "true" ? "default" : "outline"}
                size="sm"
                className="h-9 flex items-center gap-2"
                onClick={() => setGuestsAllowed(guestsAllowed === "true" ? "" : "true")}
              >
                <Users className="h-4 w-4" />
                Guests OK
              </Button>
            </div>
          </div>

          <Separator />

          {/* Near Transit */}
          <div className="space-y-3">
            <Button
              type="button"
              variant={nearTransit === "true" ? "default" : "outline"}
              size="sm"
              className="h-9 flex items-center gap-2 w-full justify-start"
              onClick={() => setNearTransit(nearTransit === "true" ? "" : "true")}
            >
              <Train className="h-4 w-4" />
              Near transit / transport
            </Button>
          </div>

          {/* Featured Only */}
          <div className="space-y-3">
            <Button
              type="button"
              variant={featuredOnly === "true" ? "default" : "outline"}
              size="sm"
              className="h-9 flex items-center gap-2 w-full justify-start"
              onClick={() => setFeaturedOnly(featuredOnly === "true" ? "" : "true")}
            >
              <Star className="h-4 w-4" />
              Featured listings only
            </Button>
          </div>

          <Separator />

          {/* Date Listed */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Date listed
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "", label: "Any" },
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
                { value: "90", label: "Last 90 days" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={dateListed === opt.value ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setDateListed(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
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
                    onClick={() =>
                      setSelectedFurnishing(isSelected ? "" : type.value)
                    }
                    className="h-9 flex items-center gap-2"
                  >
                    {type.icon}
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Area Safety */}
          <SafetyFilterControls
            minSafetyRating={minSafetyRating}
            onMinSafetyRatingChange={(val) =>
              setMinSafetyRatingStr(val.toString())
            }
            maxCrimeIndex={maxCrimeIndex}
            onMaxCrimeIndexChange={(val) =>
              setMaxCrimeIndexStr(val.toString())
            }
            improvingOnly={improvingOnly}
            onImprovingOnlyChange={(val) =>
              setImprovingOnlyStr(val.toString())
            }
          />

          <Separator />

          {/* Amenities */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Amenities</Label>
            <div className="grid grid-cols-2 gap-2">
              {amenities.map((amenity) => {
                const isSelected = (selectedAmenities as string[]).includes(
                  amenity.key
                );
                return (
                  <Button
                    key={amenity.key}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAmenityToggle(amenity.key)}
                    className="h-9 w-full flex items-center gap-2 justify-start"
                  >
                    {amenity.icon}
                    {amenity.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <Separator />

          {/* Save Search */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => {
              const filters = {
                country: selectedCountry,
                listingTypes: selectedListingTypes,
                propertyTypes: selectedPropertyTypes,
                minPrice: minPriceStr,
                maxPrice: maxPriceStr,
                minBedrooms: minBedroomsStr,
                minBathrooms: minBathroomsStr,
                furnishing: selectedFurnishing,
                amenities: selectedAmenities,
                keyword: keywordSearch,
                minSafety: minSafetyRatingStr,
                maxCrime: maxCrimeIndexStr,
                improvingOnly: improvingOnlyStr,
              };
              const json = JSON.stringify(filters);
              navigator.clipboard.writeText(window.location.href).then(() => {
                alert("Search URL copied! Sign in to save searches to your account.");
              });
            }}
          >
            Save Search
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
