"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useQueryState,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
} from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  Property,
  ListingType,
  PropertyType,
  FurnishingType,
  SharingType,
  PreferredTenantType,
  PaymentFrequency,
} from "@/lib/types/property.type";

interface PropertyFiltersProps {
  properties: Property[];
}

const listingTypes: ListingType[] = ["sale", "rent", "student-housing"];
const propertyTypes: PropertyType[] = [
  "apartment",
  "house",
  "condo",
  "townhouse",
  "studio",
  "room",
  "other",
];
const furnishingTypes: FurnishingType[] = [
  "furnished",
  "semi-furnished",
  "unfurnished",
];
const sharingTypes: SharingType[] = ["room", "apartment", "house"];
const preferredTenantTypes: PreferredTenantType[] = [
  "students",
  "professionals",
  "families",
  "anyone",
];
const paymentFrequencies: PaymentFrequency[] = ["monthly", "weekly", "yearly"];

const amenities = [
  { key: "parkingAvailable", label: "Parking" },
  { key: "laundry", label: "Laundry" },
  { key: "heatingCooling", label: "Heating/Cooling" },
  { key: "balcony", label: "Balcony" },
  { key: "wifi", label: "WiFi" },
  { key: "gym", label: "Gym" },
  { key: "pool", label: "Pool" },
  { key: "elevator", label: "Elevator" },
  { key: "security", label: "Security" },
  { key: "garden", label: "Garden" },
  { key: "dishwasher", label: "Dishwasher" },
  { key: "fireplace", label: "Fireplace" },
] as const;

export function PropertyFilters({ properties }: PropertyFiltersProps) {
  // URL Query State - Listing & Property Type
  const [selectedListingTypes, setSelectedListingTypes] = useQueryState(
    "listingType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useQueryState(
    "propertyType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Location
  const [selectedCities, setSelectedCities] = useQueryState(
    "city",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedStates, setSelectedStates] = useQueryState(
    "state",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedZipCodes, setSelectedZipCodes] = useQueryState(
    "zipCode",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Pricing
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsString.withDefault(""),
  );
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsString.withDefault(""),
  );
  const [minRent, setMinRent] = useQueryState(
    "minRent",
    parseAsString.withDefault(""),
  );
  const [maxRent, setMaxRent] = useQueryState(
    "maxRent",
    parseAsString.withDefault(""),
  );
  const [minSecurityDeposit, setMinSecurityDeposit] = useQueryState(
    "minSecurityDeposit",
    parseAsString.withDefault(""),
  );
  const [maxSecurityDeposit, setMaxSecurityDeposit] = useQueryState(
    "maxSecurityDeposit",
    parseAsString.withDefault(""),
  );

  // Property Details
  const [minBedrooms, setMinBedrooms] = useQueryState(
    "minBedrooms",
    parseAsString.withDefault(""),
  );
  const [minBathrooms, setMinBathrooms] = useQueryState(
    "minBathrooms",
    parseAsString.withDefault(""),
  );
  const [minArea, setMinArea] = useQueryState(
    "minArea",
    parseAsString.withDefault(""),
  );
  const [maxArea, setMaxArea] = useQueryState(
    "maxArea",
    parseAsString.withDefault(""),
  );
  const [floorNumber, setFloorNumber] = useQueryState(
    "floorNumber",
    parseAsString.withDefault(""),
  );
  const [totalFloors, setTotalFloors] = useQueryState(
    "totalFloors",
    parseAsString.withDefault(""),
  );

  // Furnishing
  const [selectedFurnishing, setSelectedFurnishing] = useQueryState(
    "furnishing",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useQueryState(
    "amenities",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Shared Property
  const [isShared, setIsShared] = useQueryState(
    "isShared",
    parseAsBoolean.withDefault(false),
  );
  const [selectedSharingTypes, setSelectedSharingTypes] = useQueryState(
    "sharingType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedPreferredTenantTypes, setSelectedPreferredTenantTypes] =
    useQueryState(
      "preferredTenantType",
      parseAsArrayOf(parseAsString).withDefault([]),
    );

  // Policies
  const [smokingAllowed, setSmokingAllowed] = useQueryState(
    "smokingAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [petsAllowed, setPetsAllowed] = useQueryState(
    "petsAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [guestsAllowed, setGuestsAllowed] = useQueryState(
    "guestsAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [sublettingAllowed, setSublettingAllowed] = useQueryState(
    "sublettingAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [partiesAllowed, setPartiesAllowed] = useQueryState(
    "partiesAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [quietHours, setQuietHours] = useQueryState(
    "quietHours",
    parseAsBoolean.withDefault(false),
  );
  const [maintenanceResponsibility, setMaintenanceResponsibility] =
    useQueryState("maintenanceResponsibility", parseAsBoolean.withDefault(false));

  // Availability
  const [minLeaseLength, setMinLeaseLength] = useQueryState(
    "minLeaseLength",
    parseAsString.withDefault(""),
  );
  const [maxLeaseLength, setMaxLeaseLength] = useQueryState(
    "maxLeaseLength",
    parseAsString.withDefault(""),
  );
  const [availableFrom, setAvailableFrom] = useQueryState(
    "availableFrom",
    parseAsString.withDefault(""),
  );

  // Payment
  const [selectedPaymentFrequencies, setSelectedPaymentFrequencies] =
    useQueryState(
      "paymentFrequency",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
  const [utilitiesIncluded, setUtilitiesIncluded] = useQueryState(
    "utilitiesIncluded",
    parseAsBoolean.withDefault(false),
  );

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["listing", "location", "pricing"]),
  );

  // Get unique values from properties
  const uniqueCities = useMemo(
    () =>
      Array.from(new Set(properties.map((p) => p.city).filter(Boolean))).sort(),
    [properties],
  );
  const uniqueStates = useMemo(
    () =>
      Array.from(new Set(properties.map((p) => p.state).filter(Boolean))).sort(),
    [properties],
  );
  const uniqueZipCodes = useMemo(
    () =>
      Array.from(
        new Set(properties.map((p) => p.zipCode).filter(Boolean)),
      ).sort(),
    [properties],
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSelectedListingTypes([]);
    setSelectedPropertyTypes([]);
    setSelectedCities([]);
    setSelectedStates([]);
    setSelectedZipCodes([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRent("");
    setMaxRent("");
    setMinSecurityDeposit("");
    setMaxSecurityDeposit("");
    setMinBedrooms("");
    setMinBathrooms("");
    setMinArea("");
    setMaxArea("");
    setFloorNumber("");
    setTotalFloors("");
    setSelectedFurnishing([]);
    setSelectedAmenities([]);
    setIsShared(false);
    setSelectedSharingTypes([]);
    setSelectedPreferredTenantTypes([]);
    setSmokingAllowed(false);
    setPetsAllowed(false);
    setGuestsAllowed(false);
    setSublettingAllowed(false);
    setPartiesAllowed(false);
    setQuietHours(false);
    setMaintenanceResponsibility(false);
    setMinLeaseLength("");
    setMaxLeaseLength("");
    setAvailableFrom("");
    setSelectedPaymentFrequencies([]);
    setUtilitiesIncluded(false);
  };

  const hasActiveFilters =
    selectedListingTypes.length > 0 ||
    selectedPropertyTypes.length > 0 ||
    selectedCities.length > 0 ||
    selectedStates.length > 0 ||
    selectedZipCodes.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    minRent !== "" ||
    maxRent !== "" ||
    minSecurityDeposit !== "" ||
    maxSecurityDeposit !== "" ||
    minBedrooms !== "" ||
    minBathrooms !== "" ||
    minArea !== "" ||
    maxArea !== "" ||
    floorNumber !== "" ||
    totalFloors !== "" ||
    selectedFurnishing.length > 0 ||
    selectedAmenities.length > 0 ||
    isShared ||
    selectedSharingTypes.length > 0 ||
    selectedPreferredTenantTypes.length > 0 ||
    smokingAllowed ||
    petsAllowed ||
    guestsAllowed ||
    sublettingAllowed ||
    partiesAllowed ||
    quietHours ||
    maintenanceResponsibility ||
    minLeaseLength !== "" ||
    maxLeaseLength !== "" ||
    availableFrom !== "" ||
    selectedPaymentFrequencies.length > 0 ||
    utilitiesIncluded;

  const FilterSection = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(sectionKey);
    return (
      <div className="space-y-3 border-b border-border/50 pb-4 last:border-0">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="flex w-full items-center justify-between text-sm font-semibold hover:text-primary transition-colors"
        >
          <span>{title}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <CardHeader className="pb-4 sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Listing Type */}
          <FilterSection title="Listing Type" sectionKey="listing">
            <div className="space-y-2">
              {listingTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`listing-${type}`}
                    checked={selectedListingTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedListingTypes([...selectedListingTypes, type]);
                      } else {
                        setSelectedListingTypes(
                          selectedListingTypes.filter((t) => t !== type),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`listing-${type}`}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {type.replace("-", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Property Type */}
          <FilterSection title="Property Type" sectionKey="property">
            <div className="space-y-2">
              {propertyTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`property-${type}`}
                    checked={selectedPropertyTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPropertyTypes([
                          ...selectedPropertyTypes,
                          type,
                        ]);
                      } else {
                        setSelectedPropertyTypes(
                          selectedPropertyTypes.filter((t) => t !== type),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`property-${type}`}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection title="Location" sectionKey="location">
            <div className="space-y-3">
              {uniqueCities.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    City
                  </Label>
                  <Select
                    value={selectedCities[0] || ""}
                    onValueChange={(value) => {
                      if (value && !selectedCities.includes(value)) {
                        setSelectedCities([...selectedCities, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedCities.map((city) => (
                        <Badge
                          key={city}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() =>
                            setSelectedCities(
                              selectedCities.filter((c) => c !== city),
                            )
                          }
                        >
                          {city}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {uniqueStates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    State
                  </Label>
                  <Select
                    value={selectedStates[0] || ""}
                    onValueChange={(value) => {
                      if (value && !selectedStates.includes(value)) {
                        setSelectedStates([...selectedStates, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStates.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedStates.map((state) => (
                        <Badge
                          key={state}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() =>
                            setSelectedStates(
                              selectedStates.filter((s) => s !== state),
                            )
                          }
                        >
                          {state}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {uniqueZipCodes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Zip Code
                  </Label>
                  <Select
                    value={selectedZipCodes[0] || ""}
                    onValueChange={(value) => {
                      if (value && !selectedZipCodes.includes(value)) {
                        setSelectedZipCodes([...selectedZipCodes, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select zip code" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueZipCodes.map((zip) => (
                        <SelectItem key={zip} value={zip}>
                          {zip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedZipCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedZipCodes.map((zip) => (
                        <Badge
                          key={zip}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() =>
                            setSelectedZipCodes(
                              selectedZipCodes.filter((z) => z !== zip),
                            )
                          }
                        >
                          {zip}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </FilterSection>

          {/* Pricing */}
          <FilterSection title="Pricing" sectionKey="pricing">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Sale Price Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value || null)}
                    className="h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value || null)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Rent Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minRent}
                    onChange={(e) => setMinRent(e.target.value || null)}
                    className="h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value || null)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Security Deposit Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minSecurityDeposit}
                    onChange={(e) =>
                      setMinSecurityDeposit(e.target.value || null)
                    }
                    className="h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxSecurityDeposit}
                    onChange={(e) =>
                      setMaxSecurityDeposit(e.target.value || null)
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Property Details */}
          <FilterSection title="Property Details" sectionKey="details">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Min Bedrooms
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value || null)}
                    className="h-9"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Min Bathrooms
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minBathrooms}
                    onChange={(e) => setMinBathrooms(e.target.value || null)}
                    className="h-9"
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Area Range (sq ft)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value || null)}
                    className="h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxArea}
                    onChange={(e) => setMaxArea(e.target.value || null)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Floor Number
                  </Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(e.target.value || null)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Total Floors
                  </Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value || null)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Furnishing */}
          <FilterSection title="Furnishing" sectionKey="furnishing">
            <div className="space-y-2">
              {furnishingTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`furnishing-${type}`}
                    checked={selectedFurnishing.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFurnishing([...selectedFurnishing, type]);
                      } else {
                        setSelectedFurnishing(
                          selectedFurnishing.filter((t) => t !== type),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`furnishing-${type}`}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {type.replace("-", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Amenities */}
          <FilterSection title="Amenities" sectionKey="amenities">
            <div className="space-y-2">
              {amenities.map((amenity) => (
                <div key={amenity.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.key}`}
                    checked={selectedAmenities.includes(amenity.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAmenities([
                          ...selectedAmenities,
                          amenity.key,
                        ]);
                      } else {
                        setSelectedAmenities(
                          selectedAmenities.filter((a) => a !== amenity.key),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`amenity-${amenity.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Shared Property */}
          <FilterSection title="Shared Property" sectionKey="shared">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label htmlFor="isShared" className="text-sm cursor-pointer">
                  Is Shared
                </Label>
                <Switch
                  id="isShared"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                />
              </div>

              {isShared && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Sharing Type
                    </Label>
                    {sharingTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sharing-${type}`}
                          checked={selectedSharingTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSharingTypes([
                                ...selectedSharingTypes,
                                type,
                              ]);
                            } else {
                              setSelectedSharingTypes(
                                selectedSharingTypes.filter((t) => t !== type),
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`sharing-${type}`}
                          className="text-sm font-normal cursor-pointer capitalize"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Preferred Tenant Type
                    </Label>
                    {preferredTenantTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tenant-${type}`}
                          checked={selectedPreferredTenantTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPreferredTenantTypes([
                                ...selectedPreferredTenantTypes,
                                type,
                              ]);
                            } else {
                              setSelectedPreferredTenantTypes(
                                selectedPreferredTenantTypes.filter(
                                  (t) => t !== type,
                                ),
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`tenant-${type}`}
                          className="text-sm font-normal cursor-pointer capitalize"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </FilterSection>

          {/* Policies */}
          <FilterSection title="Policies" sectionKey="policies">
            <div className="space-y-2">
              {[
                { key: "smokingAllowed", label: "Smoking Allowed" },
                { key: "petsAllowed", label: "Pets Allowed" },
                { key: "guestsAllowed", label: "Guests Allowed" },
                { key: "sublettingAllowed", label: "Subletting Allowed" },
                { key: "partiesAllowed", label: "Parties Allowed" },
                { key: "quietHours", label: "Quiet Hours" },
                {
                  key: "maintenanceResponsibility",
                  label: "Maintenance Responsibility",
                },
              ].map((policy) => {
                const stateMap: Record<string, boolean> = {
                  smokingAllowed,
                  petsAllowed,
                  guestsAllowed,
                  sublettingAllowed,
                  partiesAllowed,
                  quietHours,
                  maintenanceResponsibility,
                };
                const setterMap: Record<string, (val: boolean) => void> = {
                  smokingAllowed: setSmokingAllowed,
                  petsAllowed: setPetsAllowed,
                  guestsAllowed: setGuestsAllowed,
                  sublettingAllowed: setSublettingAllowed,
                  partiesAllowed: setPartiesAllowed,
                  quietHours: setQuietHours,
                  maintenanceResponsibility: setMaintenanceResponsibility,
                };

                return (
                  <div
                    key={policy.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <Label
                      htmlFor={policy.key}
                      className="text-sm cursor-pointer"
                    >
                      {policy.label}
                    </Label>
                    <Switch
                      id={policy.key}
                      checked={stateMap[policy.key] || false}
                      onCheckedChange={setterMap[policy.key]}
                    />
                  </div>
                );
              })}
            </div>
          </FilterSection>

          {/* Availability */}
          <FilterSection title="Availability" sectionKey="availability">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Lease Length (months)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minLeaseLength}
                    onChange={(e) =>
                      setMinLeaseLength(e.target.value || null)
                    }
                    className="h-9"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxLeaseLength}
                    onChange={(e) =>
                      setMaxLeaseLength(e.target.value || null)
                    }
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Available From
                </Label>
                <Input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value || null)}
                  className="h-9"
                />
              </div>
            </div>
          </FilterSection>

          {/* Payment */}
          <FilterSection title="Payment" sectionKey="payment">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Payment Frequency
                </Label>
                {paymentFrequencies.map((freq) => (
                  <div key={freq} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-${freq}`}
                      checked={selectedPaymentFrequencies.includes(freq)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPaymentFrequencies([
                            ...selectedPaymentFrequencies,
                            freq,
                          ]);
                        } else {
                          setSelectedPaymentFrequencies(
                            selectedPaymentFrequencies.filter((f) => f !== freq),
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`payment-${freq}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {freq}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label
                  htmlFor="utilitiesIncluded"
                  className="text-sm cursor-pointer"
                >
                  Utilities Included
                </Label>
                <Switch
                  id="utilitiesIncluded"
                  checked={utilitiesIncluded}
                  onCheckedChange={setUtilitiesIncluded}
                />
              </div>
            </div>
          </FilterSection>

          {/* Reset Button */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4 border-t"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full border-2 border-destructive/50 bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Filters
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

