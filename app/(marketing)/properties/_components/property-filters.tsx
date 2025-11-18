"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useQueryState,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
} from "nuqs";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  DollarSign,
  Filter,
  GraduationCap,
  HomeIcon,
  ListFilter,
  MapPin,
  Package,
  PhoneCall,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sofa,
  Sparkles,
  Square,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Property } from "@/lib/types/property.type";

interface PropertyFiltersProps {
  properties: Property[];
}

const listingTypes: Property["listingType"][] = [
  "sale",
  "rent",
  "student-housing",
];

const furnishingTypes: Property["furnishing"][] = [
  "furnished",
  "semi-furnished",
  "unfurnished",
];

const propertyTypes: Property["propertyType"][] = [
  "apartment",
  "house",
  "condo",
  "townhouse",
  "studio",
  "room",
  "other",
];

const amenityKeys = [
  "parkingAvailable",
  "wifi",
  "gym",
  "pool",
  "elevator",
  "security",
  "garden",
  "dishwasher",
  "fireplace",
  "balcony",
  "laundry",
  "heatingCooling",
] as const;

const policyKeys = [
  "smokingAllowed",
  "petsAllowed",
  "guestsAllowed",
  "sublettingAllowed",
  "partiesAllowed",
  "quietHours",
  "maintenanceResponsibility",
] as const;

type AmenityKey = (typeof amenityKeys)[number];
type PolicyKey = (typeof policyKeys)[number];

const listingTypeOptions = [
  {
    value: "sale",
    label: "Sale",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    value: "rent",
    label: "Rent",
    icon: HomeIcon,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    value: "student-housing",
    label: "Student Housing",
    icon: GraduationCap,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
] as const;

const propertyTypeOptions = [
  {
    value: "apartment",
    label: "Apartment",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    value: "house",
    label: "House",
    icon: HomeIcon,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    value: "condo",
    label: "Condo",
    icon: Building2,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    value: "townhouse",
    label: "Townhouse",
    icon: Building2,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    value: "studio",
    label: "Studio",
    icon: HomeIcon,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
  {
    value: "room",
    label: "Room",
    icon: HomeIcon,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  {
    value: "other",
    label: "Other",
    icon: Building2,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
] as const;

const furnishingOptions = [
  {
    value: "furnished",
    label: "Furnished",
    icon: Sofa,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    value: "semi-furnished",
    label: "Semi Furnished",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    value: "unfurnished",
    label: "Unfurnished",
    icon: Square,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
] as const;

export function PropertyFilters({ properties }: PropertyFiltersProps) {
  const [listingType, setListingType] = useQueryState(
    "listingType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [propertyType, setPropertyType] = useQueryState(
    "propertyType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [furnishing, setFurnishing] = useQueryState(
    "furnishing",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [city, setCity] = useQueryState(
    "city",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [state, setState] = useQueryState(
    "state",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsString.withDefault(""),
  );
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsString.withDefault(""),
  );
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
  const [amenities, setAmenities] = useQueryState(
    "amenities",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [policies, setPolicies] = useQueryState(
    "policies",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [petsOnly, setPetsOnly] = useQueryState(
    "petsAllowed",
    parseAsBoolean.withDefault(false),
  );

  const allCities = useMemo(
    () =>
      Array.from(
        new Set(properties.map((p) => p.city).filter(Boolean)),
      ).sort(),
    [properties],
  );

  const allStates = useMemo(
    () =>
      Array.from(
        new Set(properties.map((p) => p.state).filter(Boolean)),
      ).sort(),
    [properties],
  );

  const hasActiveFilters =
    listingType.length > 0 ||
    propertyType.length > 0 ||
    furnishing.length > 0 ||
    city.length > 0 ||
    state.length > 0 ||
    !!minPrice ||
    !!maxPrice ||
    !!minBedrooms ||
    !!minBathrooms ||
    !!minArea ||
    !!maxArea ||
    amenities.length > 0 ||
    policies.length > 0 ||
    petsOnly;

  const toggleArrayValue = (
    current: string[],
    value: string,
    setter: (next: string[] | null) => void,
  ) => {
    if (current.includes(value)) {
      const next = current.filter((v) => v !== value);
      setter(next.length ? next : null);
    } else {
      setter([...current, value]);
    }
  };

  const handleReset = () => {
    setListingType(null);
    setPropertyType(null);
    setFurnishing(null);
    setCity(null);
    setState(null);
    setMinPrice(null);
    setMaxPrice(null);
    setMinBedrooms(null);
    setMinBathrooms(null);
    setMinArea(null);
    setMaxArea(null);
    setAmenities(null);
    setPolicies(null);
    setPetsOnly(false);
  };

  return (
    <div className="flex h-full flex-col">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex h-full flex-col"
      >
        <div className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border/40 px-6 py-4">
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-6 px-6 py-4 w-full max-w-full"
          >
              {/* Mobile: Accordion */}
              <div className="md:hidden">
                <Accordion type="single" collapsible defaultValue="listing" className="w-full">
                  <AccordionItem value="listing" className="border-b border-border/40">
                    <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-2">
                        <ListFilter className="h-4 w-4 text-primary" />
                        <span>Listing</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4">
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-foreground">
                            Listing Type
                          </Label>
                          <div className="flex flex-wrap gap-2.5">
                            {listingTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() =>
                                  toggleArrayValue(listingType, type, setListingType)
                                }
                                className="shrink-0 min-h-[44px] min-w-[44px]"
                              >
                                <Badge
                                  variant={
                                    listingType.includes(type) ? "default" : "outline"
                                  }
                                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-xs capitalize transition-all hover:scale-105"
                                >
                                  {type.replace("-", " ")}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-foreground">
                            Property Type
                          </Label>
                          <div className="flex flex-wrap gap-2.5">
                            {propertyTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() =>
                                  toggleArrayValue(
                                    propertyType,
                                    type,
                                    setPropertyType,
                                  )
                                }
                                className="shrink-0 min-h-[44px] min-w-[44px]"
                              >
                                <Badge
                                  variant={
                                    propertyType.includes(type) ? "default" : "outline"
                                  }
                                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-xs capitalize transition-all hover:scale-105"
                                >
                                  <Building2 className="mr-1.5 inline h-3.5 w-3.5" />
                                  {type}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-foreground">
                            Furnishing
                          </Label>
                          <div className="flex flex-wrap gap-2.5">
                            {furnishingTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() =>
                                  toggleArrayValue(furnishing, type, setFurnishing)
                                }
                                className="shrink-0 min-h-[44px] min-w-[44px]"
                              >
                                <Badge
                                  variant={
                                    furnishing.includes(type) ? "default" : "outline"
                                  }
                                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-xs capitalize transition-all hover:scale-105"
                                >
                                  {type.replace("-", " ")}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="location" className="border-b border-border/40">
                    <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>Location &amp; Price</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4">
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-foreground">
                            City
                          </Label>
                          <div className="flex flex-wrap gap-2.5">
                            {allCities.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => toggleArrayValue(city, c, setCity)}
                                className="shrink-0 min-h-[44px] min-w-[44px]"
                              >
                                <Badge
                                  variant={city.includes(c) ? "default" : "outline"}
                                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-xs transition-all hover:scale-105"
                                >
                                  {c}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-foreground">
                            State
                          </Label>
                          <div className="flex flex-wrap gap-2.5">
                            {allStates.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => toggleArrayValue(state, s, setState)}
                                className="shrink-0 min-h-[44px] min-w-[44px]"
                              >
                                <Badge
                                  variant={state.includes(s) ? "default" : "outline"}
                                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-xs transition-all hover:scale-105"
                                >
                                  {s}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                              Min Price
                            </Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder="₹ min"
                              value={minPrice}
                              onChange={(e) =>
                                setMinPrice(e.target.value || null)
                              }
                              className="h-10 w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                              Max Price
                            </Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder="₹ max"
                              value={maxPrice}
                              onChange={(e) =>
                                setMaxPrice(e.target.value || null)
                              }
                              className="h-10 w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="size" className="border-b border-border/40">
                    <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-primary" />
                        <span>Size &amp; Rooms</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4">
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                              Min Bedrooms
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={minBedrooms}
                              onChange={(e) =>
                                setMinBedrooms(e.target.value || null)
                              }
                              className="h-10 w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                              Min Bathrooms
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={minBathrooms}
                              onChange={(e) =>
                                setMinBathrooms(e.target.value || null)
                              }
                              className="h-10 w-full"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <Label className="text-sm font-medium text-foreground">
                              Area (sq ft)
                            </Label>
                            <span className="font-medium text-foreground">
                              {minArea || "0"} – {maxArea || "∞"}
                            </span>
                          </div>
                          <Slider
                            min={0}
                            max={5000}
                            step={100}
                            value={[
                              Number(minArea || 0),
                              Number(maxArea || 5000),
                            ]}
                            onValueChange={([min, max]) => {
                              setMinArea(min ? String(min) : null);
                              setMaxArea(max && max < 5000 ? String(max) : null);
                            }}
                            className="py-2"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="amenities" className="border-b border-border/40">
                    <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>Amenities</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4">
                      <div className="grid grid-cols-2 gap-3">
                        {amenityKeys.map((key) => (
                          <label
                            key={key}
                            className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs transition-all hover:bg-muted/50 hover:border-primary/30"
                          >
                            <Checkbox
                              checked={amenities.includes(key)}
                              onCheckedChange={() =>
                                toggleArrayValue(
                                  amenities,
                                  key,
                                  setAmenities,
                                )
                              }
                            />
                            <span className="capitalize leading-tight">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="policies" className="border-b border-border/40">
                    <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>Policies</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-semibold">
                              Pets allowed only
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Show homes where pets are allowed
                            </p>
                          </div>
                          <Switch
                            checked={petsOnly}
                            onCheckedChange={(value) => setPetsOnly(!!value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {policyKeys.map((key: PolicyKey) => (
                            <label
                              key={key}
                              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs transition-all hover:bg-muted/50 hover:border-primary/30"
                            >
                              <Checkbox
                                checked={policies.includes(key)}
                                onCheckedChange={() =>
                                  toggleArrayValue(
                                    policies,
                                    key,
                                    setPolicies,
                                  )
                                }
                              />
                              <span className="capitalize leading-tight">
                                {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Desktop: Tabs */}
              <div className="hidden md:block w-full">
                <Tabs defaultValue="listing" className="w-full">
                  <TabsList className="inline-flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-muted/40 p-1.5">
                      <TabsTrigger
                        value="listing"
                        className="flex min-w-fit items-center gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <ListFilter className="h-3.5 w-3.5" />
                        <span>Listing</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="location"
                        className="flex min-w-fit items-center gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Location &amp; Price</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="size"
                        className="flex min-w-fit items-center gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        <span>Size &amp; Rooms</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="amenities"
                        className="flex min-w-fit items-center gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Amenities</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="policies"
                        className="flex min-w-fit items-center gap-1.5 rounded-md px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Policies</span>
                      </TabsTrigger>
                    </TabsList>

                  <TabsContent value="listing" className="mt-5 w-full space-y-5">
                    <div className="space-y-3 w-full">
                      <Label className="text-sm font-medium text-foreground">
                        Listing Type
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {listingTypeOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = listingType.includes(option.value);

                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                toggleArrayValue(
                                  listingType,
                                  option.value,
                                  setListingType,
                                )
                              }
                              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all ${
                                isSelected
                                  ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                                  : "border-border bg-muted/30 hover:bg-muted/50"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {isSelected && (
                                <motion.div
                                  className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                                  layoutId="listingTypeFilterBg"
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
                                />
                              )}
                              <div className="relative z-10 flex flex-col items-center gap-1.5">
                                <Icon
                                  className={`h-5 w-5 ${
                                    isSelected
                                      ? option.color
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <span
                                  className={`font-medium ${
                                    isSelected
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {option.label}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 w-full">
                      <Label className="text-sm font-medium text-foreground">
                        Property Type
                      </Label>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {propertyTypeOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = propertyType.includes(option.value);

                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                toggleArrayValue(
                                  propertyType,
                                  option.value,
                                  setPropertyType,
                                )
                              }
                              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all ${
                                isSelected
                                  ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                                  : "border-border bg-muted/30 hover:bg-muted/50"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {isSelected && (
                                <motion.div
                                  className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                                  layoutId="propertyTypeFilterBg"
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
                                />
                              )}
                              <div className="relative z-10 flex flex-col items-center gap-1.5">
                                <Icon
                                  className={`h-5 w-5 ${
                                    isSelected
                                      ? option.color
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <span
                                  className={`font-medium ${
                                    isSelected
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {option.label}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 w-full">
                      <Label className="text-sm font-medium text-foreground">
                        Furnishing
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {furnishingOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = furnishing.includes(option.value);

                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                toggleArrayValue(
                                  furnishing,
                                  option.value,
                                  setFurnishing,
                                )
                              }
                              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all ${
                                isSelected
                                  ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                                  : "border-border bg-muted/30 hover:bg-muted/50"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {isSelected && (
                                <motion.div
                                  className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                                  layoutId="furnishingFilterBg"
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
                                />
                              )}
                              <div className="relative z-10 flex flex-col items-center gap-1.5">
                                <Icon
                                  className={`h-5 w-5 ${
                                    isSelected
                                      ? option.color
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <span
                                  className={`font-medium ${
                                    isSelected
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {option.label}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="mt-5 w-full space-y-5">
                    <div className="space-y-3 w-full">
                      <Label className="text-sm font-medium text-foreground">
                        City
                      </Label>
                      <div className="flex flex-wrap gap-2.5 w-full">
                        {allCities.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleArrayValue(city, c, setCity)}
                            className="shrink-0"
                          >
                            <Badge
                              variant={city.includes(c) ? "default" : "outline"}
                              className="cursor-pointer whitespace-nowrap px-4 py-2 text-xs transition-all hover:scale-105"
                            >
                              {c}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 w-full">
                      <Label className="text-sm font-medium text-foreground">
                        State
                      </Label>
                      <div className="flex flex-wrap gap-2.5 w-full">
                        {allStates.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleArrayValue(state, s, setState)}
                            className="shrink-0"
                          >
                            <Badge
                              variant={state.includes(s) ? "default" : "outline"}
                              className="cursor-pointer whitespace-nowrap px-4 py-2 text-xs transition-all hover:scale-105"
                            >
                              {s}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-medium text-foreground">
                          Min Price
                        </Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="₹ min"
                          value={minPrice}
                          onChange={(e) =>
                            setMinPrice(e.target.value || null)
                          }
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-medium text-foreground">
                          Max Price
                        </Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="₹ max"
                          value={maxPrice}
                          onChange={(e) =>
                            setMaxPrice(e.target.value || null)
                          }
                          className="h-10 w-full"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="size" className="mt-5 w-full space-y-5">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-medium text-foreground">
                          Min Bedrooms
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={minBedrooms}
                          onChange={(e) =>
                            setMinBedrooms(e.target.value || null)
                          }
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-medium text-foreground">
                          Min Bathrooms
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={minBathrooms}
                          onChange={(e) =>
                            setMinBathrooms(e.target.value || null)
                          }
                          className="h-10 w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 w-full">
                      <div className="flex items-center justify-between text-xs w-full">
                        <Label className="text-sm font-medium text-foreground">
                          Area (sq ft)
                        </Label>
                        <span className="font-medium text-foreground">
                          {minArea || "0"} – {maxArea || "∞"}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={5000}
                        step={100}
                        value={[
                          Number(minArea || 0),
                          Number(maxArea || 5000),
                        ]}
                        onValueChange={([min, max]) => {
                          setMinArea(min ? String(min) : null);
                          setMaxArea(max && max < 5000 ? String(max) : null);
                        }}
                        className="py-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="amenities" className="mt-5 w-full space-y-4">
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {amenityKeys.map((key) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs transition-all hover:bg-muted/50 hover:border-primary/30"
                        >
                          <Checkbox
                            checked={amenities.includes(key)}
                            onCheckedChange={() =>
                              toggleArrayValue(
                                amenities,
                                key,
                                setAmenities,
                              )
                            }
                          />
                          <span className="capitalize leading-tight">
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="policies" className="mt-5 w-full space-y-4">
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 w-full">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">
                          Pets allowed only
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Show homes where pets are allowed
                        </p>
                      </div>
                      <Switch
                        checked={petsOnly}
                        onCheckedChange={(value) => setPetsOnly(!!value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      {policyKeys.map((key: PolicyKey) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs transition-all hover:bg-muted/50 hover:border-primary/30"
                        >
                          <Checkbox
                            checked={policies.includes(key)}
                            onCheckedChange={() =>
                              toggleArrayValue(
                                policies,
                                key,
                                setPolicies,
                              )
                            }
                          />
                          <span className="capitalize leading-tight">
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 border-t border-border/40 pt-4"
              >
                <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  Active Filters
                </Label>
                <div className="flex flex-wrap gap-2">
                  {listingType.map((lt) => (
                    <Badge
                      key={`lt-${lt}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs capitalize"
                    >
                      {lt.replace("-", " ")}
                    </Badge>
                  ))}
                  {propertyType.map((pt) => (
                    <Badge
                      key={`pt-${pt}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs capitalize"
                    >
                      {pt}
                    </Badge>
                  ))}
                  {furnishing.map((f) => (
                    <Badge
                      key={`fur-${f}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs capitalize"
                    >
                      {f.replace("-", " ")}
                    </Badge>
                  ))}
                  {city.map((c) => (
                    <Badge
                      key={`city-${c}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      {c}
                    </Badge>
                  ))}
                  {state.map((s) => (
                    <Badge
                      key={`state-${s}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      {s}
                    </Badge>
                  ))}
                  {(minPrice || maxPrice) && (
                    <Badge
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      ₹{minPrice || 0} – ₹{maxPrice || "∞"}
                    </Badge>
                  )}
                  {(minBedrooms || minBathrooms) && (
                    <Badge
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      {minBedrooms && `≥${minBedrooms} beds`}{" "}
                      {minBathrooms && `≥${minBathrooms} baths`}
                    </Badge>
                  )}
                  {(minArea || maxArea) && (
                    <Badge
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      {minArea || 0}–{maxArea || "∞"} sq ft
                    </Badge>
                  )}
                  {amenities.map((a) => (
                    <Badge
                      key={`amenity-${a}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs capitalize"
                    >
                      {a.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </Badge>
                  ))}
                  {policies.map((p) => (
                    <Badge
                      key={`policy-${p}`}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs capitalize"
                    >
                      {p.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </Badge>
                  ))}
                  {petsOnly && (
                    <Badge
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                    >
                      Pets allowed only
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}


