"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { motion, AnimatePresence } from "motion/react";
import { Search, Home, AlertTriangle } from "lucide-react";

import { useFirebaseRealtime } from "@/hooks/use-firebase-realtime";
import type {
  Property,
  ListingType,
  PropertyType,
} from "@/lib/types/property.type";
import { PropertyCard } from "./_components/property-card";
import { PropertySortControls } from "./_components/property-sort-controls";
import { PropertyMapView } from "./_components/property-map-view";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

const PAGE_SIZE = 24;

// Calculate distance between two coordinates using Haversine formula
// Returns distance in kilometers
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
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
  const { data, loading, error } = useFirebaseRealtime<Property>("properties");
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [page, setPage] = useQueryState("page", parseAsString.withDefault("1"));
  const [viewMode] = useQueryState("view", parseAsString.withDefault("cards"));
  const [sortOption] = useQueryState(
    "sort",
    parseAsString.withDefault("new-first"),
  );
  const [lat, setLat] = useQueryState("lat", parseAsString.withDefault(""));
  const [lng, setLng] = useQueryState("lng", parseAsString.withDefault(""));
  const [locationLabel, setLocationLabel] = useQueryState(
    "loc",
    parseAsString.withDefault(""),
  );
  const [listingType, setListingType] = useQueryState(
    "listingType",
    parseAsString.withDefault(""),
  );
  const [propertyType, setPropertyType] = useQueryState(
    "propertyType",
    parseAsString.withDefault(""),
  );

  const properties = (data as Property[]) || [];

  // Reset page to 1 when search, sort, or location change
  useEffect(() => {
    setPage("1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortOption, lat, lng, listingType, propertyType]);

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

      // Filter by listing type if specified
      if (listingType && property.listingType !== listingType) {
        return false;
      }

      // Filter by property type if specified
      if (propertyType && property.propertyType !== propertyType) {
        return false;
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
            propertyLng,
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
          a.listingType === "sale"
            ? (a.price ?? Infinity)
            : (a.rent ?? Infinity);
        const bPrice =
          b.listingType === "sale"
            ? (b.price ?? Infinity)
            : (b.rent ?? Infinity);
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
  ]);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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
    ...(listingType
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
    ...(propertyType
      ? [
          {
            id: "propertyType",
            label: "Property",
            value: propertyType.charAt(0).toUpperCase() + propertyType.slice(1),
            onRemove: () => setPropertyType(null),
          },
        ]
      : []),
  ];

  const handleClearAllFilters = () => {
    setLat(null);
    setLng(null);
    setLocationLabel(null);
    setListingType(null);
    setPropertyType(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto h-5 w-80" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-72" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {error.message || "Failed to load properties. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-3 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Home className="h-3.5 w-3.5" />
          Live properties from Realtime Database
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Find your next home
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Browse all properties with realtime updates and an interactive map
          view.
        </p>
      </motion.div>

      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-xl border-2 border-border/60 bg-card/70 p-4 sm:p-5 shadow-sm"
        >
          {/* Search Inputs Row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-4 sm:mb-5">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value || null)}
                placeholder="Search by title, address, city…"
                className="h-9 pl-9 text-sm w-full"
              />
            </div>
            <div className="relative flex-1 min-w-0 sm:flex-shrink-0 sm:max-w-[280px]">
              <PropertyLocationSearch />
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
                Showing {paginated.length} of {filteredSorted.length} properties
              </span>
            </div>
            <div className="flex-shrink-0">
              <PropertySortControls />
            </div>
          </div>
        </motion.div>

        {viewMode === "map" ? (
          <PropertyMapView properties={filteredSorted} />
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
                <h3 className="text-lg font-semibold">No properties found</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {locationLabel || listingType || propertyType
                    ? `No properties found with your current filters${locationLabel ? ` near ${locationLabel}` : ""}. Try adjusting your search criteria.`
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
                      isHighlighted={highlightedId === property.id}
                      onHoverChange={(hovered) =>
                        setHighlightedId(hovered ? property.id : null)
                      }
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {viewMode !== "map" && totalPages > 1 && (
          <Pagination className="pt-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={`?page=${Math.max(1, (Number(page) || 1) - 1)}`}
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
                      href={`?page=${pageNumber}`}
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
                  href={`?page=${Math.min(
                    totalPages,
                    (Number(page) || 1) + 1,
                  )}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(
                      Math.min(totalPages, (Number(page) || 1) + 1),
                    );
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </motion.div>
  );
}
