"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useQueryState,
  parseAsString,
} from "nuqs";
import { motion, AnimatePresence } from "motion/react";
import { Search, Home, AlertTriangle } from "lucide-react";

import { useFirebaseRealtime } from "@/hooks/use-firebase-realtime";
import type { Property } from "@/lib/types/property.type";
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

const PAGE_SIZE = 24;

export default function PropertiesPage() {
  const { data, loading, error } = useFirebaseRealtime<Property>("properties");
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [page, setPage] = useQueryState("page", parseAsString.withDefault("1"));
  const [viewMode] = useQueryState("view", parseAsString.withDefault("cards"));
  const [sortOption] = useQueryState(
    "sort",
    parseAsString.withDefault("new-first")
  );

  const properties = (data as Property[]) || [];

  // Reset page to 1 when search or sort change
  useEffect(() => {
    setPage("1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortOption]);

  const { filteredSorted, paginated, totalPages } = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    let result = properties.filter((property) => {
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
  }, [properties, search, sortOption, page]);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const handlePageChange = (newPage: number) => {
    setPage(String(newPage));
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
          Browse all properties with realtime updates and an interactive map view.
        </p>
      </motion.div>

      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-3 rounded-xl border-2 border-border/60 bg-card/70 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 md:max-w-2xl md:flex-row md:items-center md:gap-3">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value || null)}
                  placeholder="Search by title, address, city…"
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <div className="w-full md:w-[260px]">
                <PropertyLocationSearch />
              </div>
            </div>

            <div className="w-full md:w-auto">
              <PropertySortControls />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {paginated.length} of {filteredSorted.length} properties
            </span>
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
                  Try adjusting your search term to widen the results.
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
                    (Number(page) || 1) + 1
                  )}`}
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
    </motion.div>
  );
}
