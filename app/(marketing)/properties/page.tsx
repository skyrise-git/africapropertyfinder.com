"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { motion, AnimatePresence } from "motion/react";
import { Search, Home, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { useCountry } from "@/contexts/country-context";
import type { Property } from "@/lib/types/property.type";
import { PropertyCard } from "./_components/property-card";
import { PropertySortControls } from "./_components/property-sort-controls";
import { PropertyMapView } from "./_components/property-map-view";
import { PropertySplitView } from "./_components/property-split-view";
import { PropertyLoadingView } from "./_components/property-loading-view";
import { PropertyErrorView } from "./_components/property-error-view";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PropertyLocationSearch } from "./_components/property-location-search";
import { FilterChips } from "@/components/ui/filter-chips";
import { PropertyFiltersSidebar } from "./_components/property-filters-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_SIZE = 24;

// Calculate distance between two coordinates using Haversine formula
// Returns distance in kilometers
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const SEARCH_RADIUS_KM = 50; // Default search radius in kilometers

export default function PropertiesPage() {
  const { data, loading, error } = useSupabaseRealtime<Property>("properties");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [page, setPage] = useQueryState("page", parseAsString.withDefault("1"));
  const [viewMode, setViewMode] = useQueryState("view", parseAsString.withDefault("cards"));
  const [mapSelectedPropertyId, setMapSelectedPropertyId] = useState<string | null>(null);
  const [sortOption] = useQueryState(
    "sort",
    parseAsString.withDefault("new-first")
  );
  const [lat, setLat] = useQueryState("lat", parseAsString.withDefault(""));
  const [lng, setLng] = useQueryState("lng", parseAsString.withDefault(""));
  const [locationLabel, setLocationLabel] = useQueryState(
    "loc",
    parseAsString.withDefault("")
  );
  const [listingType, setListingType] = useQueryState(
    "listingType",
    parseAsString.withDefault("")
  );
  const [propertyType, setPropertyType] = useQueryState(
    "propertyType",
    parseAsString.withDefault("")
  );

  // Sidebar filters
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
  const [selectedFurnishing, setSelectedFurnishing] = useQueryState(
    "furnishing",
    parseAsString.withDefault("")
  );
  const [selectedAmenities, setSelectedAmenities] = useQueryState(
    "amenities",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [selectedCountryRaw, setSelectedCountry] = useQueryState("country", parseAsString.withDefault(""));
  const { countryName } = useCountry();
  const selectedCountry = selectedCountryRaw || countryName;
  const [selectedCity, setSelectedCity] = useQueryState("city", parseAsString.withDefault(""));
  const [selectedProvince, setSelectedProvince] = useQueryState("province", parseAsString.withDefault(""));
  const [minAreaStr, setMinAreaStr] = useQueryState("minArea", parseAsString.withDefault(""));
  const [maxAreaStr, setMaxAreaStr] = useQueryState("maxArea", parseAsString.withDefault(""));
  const [petsAllowed, setPetsAllowed] = useQueryState("pets", parseAsString.withDefault(""));
  const [smokingAllowed, setSmokingAllowed] = useQueryState("smoking", parseAsString.withDefault(""));
  const [guestsAllowed, setGuestsAllowed] = useQueryState("guests", parseAsString.withDefault(""));
  const [nearTransit, setNearTransit] = useQueryState("transit", parseAsString.withDefault(""));
  const [featuredOnly, setFeaturedOnly] = useQueryState("featured", parseAsString.withDefault(""));
  const [dateListed, setDateListed] = useQueryState("listed", parseAsString.withDefault(""));
  const [keywordSearch, setKeywordSearch] = useQueryState("keyword", parseAsString.withDefault(""));
  const [minSafetyRatingStr, setMinSafetyRatingStr] = useQueryState("minSafety", parseAsString.withDefault("1"));
  const [maxCrimeIndexStr, setMaxCrimeIndexStr] = useQueryState("maxCrime", parseAsString.withDefault("100"));
  const [improvingOnlyStr, setImprovingOnlyStr] = useQueryState("improvingOnly", parseAsString.withDefault("false"));
  const searchParams = useSearchParams();

  // Convert string filters to numbers
  const minPrice = minPriceStr ? Number(minPriceStr) : null;
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : null;
  const minBedrooms = minBedroomsStr ? Number(minBedroomsStr) : null;
  const minBathrooms = minBathroomsStr ? Number(minBathroomsStr) : null;
  const minSafetyRating = Number(minSafetyRatingStr) || 1;
  const maxCrimeIndex = Number(maxCrimeIndexStr) || 100;
  const improvingOnly = improvingOnlyStr === "true";

  // Sync legacy listingType with sidebar filters
  useEffect(() => {
    if (listingType && (selectedListingTypes as string[]).length === 0) {
      setSelectedListingTypes([listingType]);
    } else if (
      !listingType &&
      (selectedListingTypes as string[]).length === 1
    ) {
      // If sidebar has one filter and legacy is cleared, keep sidebar
    }
  }, [listingType, selectedListingTypes, setSelectedListingTypes]);

  // Sync legacy propertyType with sidebar filters
  useEffect(() => {
    if (propertyType && (selectedPropertyTypes as string[]).length === 0) {
      setSelectedPropertyTypes([propertyType]);
    } else if (
      !propertyType &&
      (selectedPropertyTypes as string[]).length === 1
    ) {
      // If sidebar has one filter and legacy is cleared, keep sidebar
    }
  }, [propertyType, selectedPropertyTypes, setSelectedPropertyTypes]);

  const properties = data ?? [];

  // Reset page to 1 when search, sort, or location change
  useEffect(() => {
    setPage("1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    sortOption,
    lat,
    lng,
    listingType,
    propertyType,
    selectedListingTypes,
    selectedPropertyTypes,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    selectedFurnishing,
    selectedAmenities,
    selectedCountry,
    selectedCity,
    selectedProvince,
    minAreaStr,
    maxAreaStr,
    petsAllowed,
    smokingAllowed,
    guestsAllowed,
    nearTransit,
    featuredOnly,
    dateListed,
    keywordSearch,
    minSafetyRating,
    maxCrimeIndex,
    improvingOnly,
  ]);

  const { filteredSorted, paginated, totalPages } = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const selectedLat = lat ? Number(lat) : null;
    const selectedLng = lng ? Number(lng) : null;
    const hasLocationFilter =
      selectedLat !== null &&
      selectedLng !== null &&
      !Number.isNaN(selectedLat) &&
      !Number.isNaN(selectedLng);

    let result = properties.filter((property) => {
      // Filter by search term
      if (searchTerm) {
        const haystack = [
          property.title,
          property.address,
          property.city,
          property.state,
          property.otherAmenities,
          property.propertyType,
          property.listingType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      // Filter by listing type (legacy single filter or new multi-select)
      if (listingType && property.listingType !== listingType) {
        return false;
      }
      if ((selectedListingTypes as string[]).length > 0) {
        if (
          !(selectedListingTypes as string[]).includes(property.listingType)
        ) {
          return false;
        }
      }

      // Filter by property type (legacy single filter or new multi-select)
      if (propertyType && property.propertyType !== propertyType) {
        return false;
      }
      if ((selectedPropertyTypes as string[]).length > 0) {
        if (
          !(selectedPropertyTypes as string[]).includes(property.propertyType)
        ) {
          return false;
        }
      }

      // Filter by price range
      const propertyPrice =
        property.listingType === "sale" ? property.price : property.rent;
      if (propertyPrice !== undefined) {
        if (minPrice !== null && propertyPrice < minPrice) {
          return false;
        }
        if (maxPrice !== null && propertyPrice > maxPrice) {
          return false;
        }
      }

      // Filter by bedrooms
      if (minBedrooms !== null && property.numBedrooms < minBedrooms) {
        return false;
      }

      // Filter by bathrooms
      if (minBathrooms !== null && property.numBathrooms < minBathrooms) {
        return false;
      }

      // Filter by furnishing
      if (selectedFurnishing && property.furnishing !== selectedFurnishing) {
        return false;
      }

      // Filter by country
      if (selectedCountry && property.country !== selectedCountry) return false;

      // Filter by city
      if (selectedCity && property.city !== selectedCity) return false;

      // Filter by province
      if (selectedProvince && property.state !== selectedProvince) return false;

      // Filter by area/size
      const minArea = minAreaStr ? Number(minAreaStr) : null;
      const maxArea = maxAreaStr ? Number(maxAreaStr) : null;
      if (minArea != null && (property.area ?? 0) < minArea) return false;
      if (maxArea != null && (property.area ?? Infinity) > maxArea) return false;

      // Filter by policies
      if (petsAllowed === "true" && !property.petsAllowed) return false;
      if (smokingAllowed === "true" && !property.smokingAllowed) return false;
      if (guestsAllowed === "true" && !property.guestsAllowed) return false;

      // Filter by near transit
      if (nearTransit === "true" && !property.nearbyTransit) return false;

      // Filter by featured
      if (featuredOnly === "true" && !property.featured) return false;

      // Filter by date listed
      if (dateListed) {
        const days = Number(dateListed);
        if (days > 0 && property.createdAt) {
          const cutoff = Date.now() - days * 86_400_000;
          if (new Date(property.createdAt).getTime() < cutoff) return false;
        }
      }

      // Filter by keyword (from sidebar)
      if (keywordSearch) {
        const kw = keywordSearch.trim().toLowerCase();
        const haystack = [
          property.title,
          property.address,
          property.city,
          property.state,
          property.otherAmenities,
          property.nearbyTransit,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(kw)) return false;
      }

      // Safety filter controls
      const safetySource = property as Property & {
        safetyRating?: number;
        crimeIndex?: number;
        crimeTrend?: string;
      };
      const safetyRating = safetySource.safetyRating ?? 0;
      const safetyCrimeIndex = safetySource.crimeIndex ?? 100;
      const safetyTrend = safetySource.crimeTrend ?? "";
      if (minSafetyRating > 1 && safetyRating < minSafetyRating) return false;
      if (maxCrimeIndex < 100 && safetyCrimeIndex > maxCrimeIndex) return false;
      if (improvingOnly && safetyTrend !== "improving") return false;

      // Filter by amenities
      if ((selectedAmenities as string[]).length > 0) {
        const propertyAmenities = [
          property.parkingAvailable && "parkingAvailable",
          property.laundry && "laundry",
          property.heatingCooling && "heatingCooling",
          property.balcony && "balcony",
          property.wifi && "wifi",
          property.gym && "gym",
          property.pool && "pool",
          property.elevator && "elevator",
          property.security && "security",
          property.garden && "garden",
          property.dishwasher && "dishwasher",
          property.fireplace && "fireplace",
        ].filter(Boolean) as string[];

        const hasAllSelectedAmenities = (selectedAmenities as string[]).every(
          (amenity) => propertyAmenities.includes(amenity)
        );

        if (!hasAllSelectedAmenities) {
          return false;
        }
      }

      // Filter by location if a location is selected
      if (hasLocationFilter && property.location) {
        const propertyLat = property.location.latitude;
        const propertyLng = property.location.longitude;

        if (
          typeof propertyLat === "number" &&
          typeof propertyLng === "number" &&
          !Number.isNaN(propertyLat) &&
          !Number.isNaN(propertyLng)
        ) {
          const distance = calculateDistance(
            selectedLat!,
            selectedLng!,
            propertyLat,
            propertyLng
          );

          // Only include properties within the search radius
          if (distance > SEARCH_RADIUS_KM) {
            return false;
          }
        } else {
          // If property doesn't have valid coordinates, exclude it when location filter is active
          return false;
        }
      }

      return true;
    });

    result = result.sort((a, b) => {
      if (sortOption === "new-first" || sortOption === "old-first") {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOption === "new-first" ? bTime - aTime : aTime - bTime;
      }

      if (sortOption === "price-low-high" || sortOption === "price-high-low") {
        const aPrice =
          a.listingType === "sale" ? a.price ?? Infinity : a.rent ?? Infinity;
        const bPrice =
          b.listingType === "sale" ? b.price ?? Infinity : b.rent ?? Infinity;
        return sortOption === "price-low-high"
          ? aPrice - bPrice
          : bPrice - aPrice;
      }

      if (
        sortOption === "area-large-small" ||
        sortOption === "area-small-large"
      ) {
        const aArea = a.area ?? 0;
        const bArea = b.area ?? 0;
        return sortOption === "area-large-small"
          ? bArea - aArea
          : aArea - bArea;
      }

      return 0;
    });

    const currentPage = Math.max(1, Number(page) || 1);
    const totalPages = Math.max(1, Math.ceil(result.length / PAGE_SIZE) || 1);
    const clampedPage = Math.min(currentPage, totalPages);
    const start = (clampedPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return {
      filteredSorted: result,
      paginated: result.slice(start, end),
      totalPages,
    };
  }, [
    properties,
    search,
    sortOption,
    page,
    lat,
    lng,
    listingType,
    propertyType,
    selectedListingTypes,
    selectedPropertyTypes,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    selectedFurnishing,
    selectedAmenities,
    selectedCountry,
    selectedCity,
    selectedProvince,
    minAreaStr,
    maxAreaStr,
    petsAllowed,
    smokingAllowed,
    guestsAllowed,
    nearTransit,
    featuredOnly,
    dateListed,
    keywordSearch,
    minSafetyRating,
    maxCrimeIndex,
    improvingOnly,
  ]);

  const handlePageChange = (newPage: number) => {
    setPage(String(newPage));
  };

  // Create filter chips data
  const activeFilters = [
    ...(locationLabel
      ? [
          {
            id: "location",
            label: "Location",
            value: locationLabel,
            onRemove: () => {
              setLat(null);
              setLng(null);
              setLocationLabel(null);
            },
          },
        ]
      : []),
    // Legacy single listing type filter
    ...(listingType && (selectedListingTypes as string[]).length === 0
      ? [
          {
            id: "listingType",
            label: "Type",
            value:
              listingType === "sale"
                ? "For Sale"
                : listingType === "rent"
                ? "For Rent"
                : "Student Housing",
            onRemove: () => setListingType(null),
          },
        ]
      : []),
    // Sidebar multi-select listing types
    ...(selectedListingTypes as string[]).map((type) => ({
      id: `listingType-${type}`,
      label: "Type",
      value:
        type === "sale"
          ? "For Sale"
          : type === "rent"
          ? "For Rent"
          : "Student Housing",
      onRemove: () => {
        const current = selectedListingTypes as string[];
        setSelectedListingTypes(current.filter((t) => t !== type));
      },
    })),
    // Legacy single property type filter (only show if sidebar is empty)
    ...(propertyType && (selectedPropertyTypes as string[]).length === 0
      ? [
          {
            id: "propertyType",
            label: "Property",
            value: propertyType.charAt(0).toUpperCase() + propertyType.slice(1),
            onRemove: () => {
              setPropertyType(null);
            },
          },
        ]
      : []),
    // Sidebar multi-select property types
    ...(selectedPropertyTypes as string[]).map((type) => ({
      id: `propertyType-${type}`,
      label: "Property",
      value: type.charAt(0).toUpperCase() + type.slice(1),
      onRemove: () => {
        const current = selectedPropertyTypes as string[];
        setSelectedPropertyTypes(current.filter((t) => t !== type));
      },
    })),
    // Price range
    ...(minPrice !== null || maxPrice !== null
      ? [
          {
            id: "price",
            label: "Price",
            value:
              minPrice !== null && maxPrice !== null
                ? `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`
                : minPrice !== null
                ? `Min: $${minPrice.toLocaleString()}`
                : maxPrice !== null
                ? `Max: $${maxPrice.toLocaleString()}`
                : "",
            onRemove: () => {
              setMinPriceStr("");
              setMaxPriceStr("");
            },
          },
        ]
      : []),
    // Bedrooms
    ...(minBedrooms !== null
      ? [
          {
            id: "bedrooms",
            label: "Bedrooms",
            value: `${minBedrooms}+`,
            onRemove: () => {
              setMinBedroomsStr("");
            },
          },
        ]
      : []),
    // Bathrooms
    ...(minBathrooms !== null
      ? [
          {
            id: "bathrooms",
            label: "Bathrooms",
            value: `${minBathrooms}+`,
            onRemove: () => {
              setMinBathroomsStr("");
            },
          },
        ]
      : []),
    // Furnishing
    ...(selectedFurnishing
      ? [
          {
            id: "furnishing",
            label: "Furnishing",
            value:
              selectedFurnishing === "furnished"
                ? "Furnished"
                : selectedFurnishing === "semi-furnished"
                ? "Semi-Furnished"
                : "Unfurnished",
            onRemove: () => {
              setSelectedFurnishing("");
            },
          },
        ]
      : []),
    ...(selectedCountry
      ? [
          {
            id: "country",
            label: "Country",
            value: selectedCountry,
            onRemove: () => setSelectedCountry(""),
          },
        ]
      : []),
    // Province
    ...(selectedProvince
      ? [{ id: "province", label: "Province", value: selectedProvince, onRemove: () => setSelectedProvince("") }]
      : []),
    // City
    ...(selectedCity
      ? [{ id: "city", label: "City", value: selectedCity, onRemove: () => setSelectedCity("") }]
      : []),
    // Area
    ...(minAreaStr || maxAreaStr
      ? [{
          id: "area",
          label: "Area",
          value: `${minAreaStr || "0"} – ${maxAreaStr || "∞"} m²`,
          onRemove: () => { setMinAreaStr(""); setMaxAreaStr(""); },
        }]
      : []),
    // Policies
    ...(petsAllowed === "true"
      ? [{ id: "pets", label: "Policy", value: "Pets allowed", onRemove: () => setPetsAllowed("") }]
      : []),
    ...(smokingAllowed === "true"
      ? [{ id: "smoking", label: "Policy", value: "Smoking allowed", onRemove: () => setSmokingAllowed("") }]
      : []),
    ...(guestsAllowed === "true"
      ? [{ id: "guests", label: "Policy", value: "Guests allowed", onRemove: () => setGuestsAllowed("") }]
      : []),
    // Transit
    ...(nearTransit === "true"
      ? [{ id: "transit", label: "Location", value: "Near transit", onRemove: () => setNearTransit("") }]
      : []),
    // Featured
    ...(featuredOnly === "true"
      ? [{ id: "featured", label: "Listing", value: "Featured only", onRemove: () => setFeaturedOnly("") }]
      : []),
    // Date listed
    ...(dateListed
      ? [{
          id: "dateListed",
          label: "Listed",
          value: `Last ${dateListed} days`,
          onRemove: () => setDateListed(""),
        }]
      : []),
    // Keyword
    ...(keywordSearch
      ? [{ id: "keyword", label: "Keyword", value: keywordSearch, onRemove: () => setKeywordSearch("") }]
      : []),
    ...(minSafetyRating > 1
      ? [{ id: "minSafety", label: "Safety", value: `${minSafetyRating}+`, onRemove: () => setMinSafetyRatingStr("1") }]
      : []),
    ...(maxCrimeIndex < 100
      ? [{ id: "maxCrime", label: "Crime", value: `<= ${maxCrimeIndex}`, onRemove: () => setMaxCrimeIndexStr("100") }]
      : []),
    ...(improvingOnly
      ? [{ id: "improvingOnly", label: "Trend", value: "Improving only", onRemove: () => setImprovingOnlyStr("false") }]
      : []),
    // Amenities
    ...(selectedAmenities as string[]).map((amenity) => {
      const amenityLabels: Record<string, string> = {
        parkingAvailable: "Parking",
        laundry: "Laundry",
        heatingCooling: "Heating & Cooling",
        balcony: "Balcony",
        wifi: "WiFi",
        gym: "Gym",
        pool: "Pool",
        elevator: "Elevator",
        security: "Security",
        garden: "Garden",
        dishwasher: "Dishwasher",
        fireplace: "Fireplace",
      };
      return {
        id: `amenity-${amenity}`,
        label: "Amenity",
        value: amenityLabels[amenity] || amenity,
        onRemove: () => {
          const current = selectedAmenities as string[];
          setSelectedAmenities(current.filter((a) => a !== amenity));
        },
      };
    }),
  ];

  const handleClearAllFilters = () => {
    setLat("");
    setLng("");
    setLocationLabel("");
    setListingType("");
    setPropertyType("");
    setSelectedListingTypes([]);
    setSelectedPropertyTypes([]);
    setMinPriceStr("");
    setMaxPriceStr("");
    setMinBedroomsStr("");
    setMinBathroomsStr("");
    setSelectedFurnishing("");
    setSelectedAmenities([]);
    setSelectedCountry("");
    setSelectedProvince("");
    setSelectedCity("");
    setMinAreaStr("");
    setMaxAreaStr("");
    setPetsAllowed("");
    setSmokingAllowed("");
    setGuestsAllowed("");
    setNearTransit("");
    setFeaturedOnly("");
    setDateListed("");
    setKeywordSearch("");
    setMinSafetyRatingStr("1");
    setMaxCrimeIndexStr("100");
    setImprovingOnlyStr("false");
  };

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  };

  if (loading) {
    return <PropertyLoadingView />;
  }

  if (error) {
    return <PropertyErrorView error={error} />;
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-2 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            Live properties from Realtime Database
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-700 dark:text-gray-100 tracking-tight">
            Find your next home
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Browse all properties with realtime updates and an interactive map
            view.
          </p>
        </motion.div>

        {/* Main Content with Sidebar */}
        <div className="relative w-full flex flex-col lg:flex-row gap-5 items-start">
          {/* Filters Sidebar - Desktop (Sticky) */}
          <aside className="hidden lg:block lg:w-80 shrink-0 sticky top-24 z-20 transition-all duration-300 ease-in-out">
            <PropertyFiltersSidebar properties={properties} />
          </aside>

          {/* Main Content - Scrollable */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile Filter Button */}
            {isMobile && (
              <Sheet
                open={mobileFiltersOpen}
                onOpenChange={setMobileFiltersOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[320px] sm:w-[380px] overflow-y-auto"
                >
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <PropertyFiltersSidebar properties={properties} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-5 shadow-sm"
            >
              {/* Search Inputs Row — location first, keyword second */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-4 sm:mb-5">
                <div className="relative flex-1 min-w-0 sm:max-w-[320px]">
                  <PropertyLocationSearch />
                </div>
                <div className="relative flex-1 min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value || null)}
                    placeholder="Lakefront, garage, pool, detached…"
                    className="h-9 pl-9 text-sm w-full"
                  />
                </div>
              </div>

              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <FilterChips
                    filters={activeFilters}
                    onClearAll={handleClearAllFilters}
                  />
                </div>
              )}

              {/* Bottom Row: Results Count + Sort Controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/40">
                <div className="text-xs text-muted-foreground">
                  <span>
                    Showing {paginated.length} of {filteredSorted.length}{" "}
                    properties
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <PropertySortControls />
                </div>
              </div>
            </motion.div>

            {viewMode === "map" ? (
              <PropertyMapView
                properties={filteredSorted}
                onMarkerClick={(id) => {
                  setMapSelectedPropertyId(id);
                  setViewMode("split");
                }}
              />
            ) : viewMode === "split" ? (
              <PropertySplitView
                properties={filteredSorted}
                paginated={paginated}
                totalPages={totalPages}
                currentPage={Number(page) || 1}
                onPageChange={handlePageChange}
                initialSelectedId={mapSelectedPropertyId}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredSorted.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/40 p-10 text-center"
                  >
                    <Home className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">
                      No properties found
                    </h3>
                    <p className="max-w-md text-sm text-muted-foreground">
                      {locationLabel || listingType || propertyType
                        ? `No properties found with your current filters${
                            locationLabel ? ` near ${locationLabel}` : ""
                          }. Try adjusting your search criteria.`
                        : "Try adjusting your search term to widen the results."}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                  >
                    {paginated.map((property) => (
                      <motion.div
                        key={property.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <PropertyCard
                          property={property}
                          href={`/properties/${property.id}`}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {viewMode !== "map" && viewMode !== "split" && totalPages > 1 && (
              <Pagination className="pt-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={pageHref(Math.max(1, (Number(page) || 1) - 1))}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.max(1, (Number(page) || 1) - 1));
                      }}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    const isActive = pageNumber === (Number(page) || 1);

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={pageHref(pageNumber)}
                          isActive={isActive}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href={pageHref(
                        Math.min(totalPages, (Number(page) || 1) + 1)
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(
                          Math.min(totalPages, (Number(page) || 1) + 1)
                        );
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
