"use client";

import { useMemo } from "react";
import { useFirebaseRealtime } from "@/hooks/use-firebase-realtime";
import type { Property } from "@/lib/types/property.type";
import { PropertyCard } from "./_components/property-card";
import { PropertyFilters } from "./_components/property-filters";
import { PropertySortControls } from "./_components/property-sort-controls";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useQueryState,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
} from "nuqs";
import { motion, AnimatePresence } from "motion/react";
import {
  staggerContainer,
  scaleIn,
  staggerItem,
} from "@/lib/utils/motion-variants";
import { Home, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 24;

export default function PropertiesPage() {
  // Fetch properties from Firebase Realtime Database
  const { data, loading, error } = useFirebaseRealtime<Property>(
    "properties",
    {
      asArray: true,
      nested: false,
    },
  );

  const properties = (data as Property[]) || [];

  // Search
  const [searchTerm, setSearchTerm] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );

  // Filters - Listing & Property Type
  const [selectedListingTypes] = useQueryState(
    "listingType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedPropertyTypes] = useQueryState(
    "propertyType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Location
  const [selectedCities] = useQueryState(
    "city",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedStates] = useQueryState(
    "state",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedZipCodes] = useQueryState(
    "zipCode",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Pricing
  const [minPrice] = useQueryState("minPrice", parseAsString.withDefault(""));
  const [maxPrice] = useQueryState("maxPrice", parseAsString.withDefault(""));
  const [minRent] = useQueryState("minRent", parseAsString.withDefault(""));
  const [maxRent] = useQueryState("maxRent", parseAsString.withDefault(""));
  const [minSecurityDeposit] = useQueryState(
    "minSecurityDeposit",
    parseAsString.withDefault(""),
  );
  const [maxSecurityDeposit] = useQueryState(
    "maxSecurityDeposit",
    parseAsString.withDefault(""),
  );

  // Property Details
  const [minBedrooms] = useQueryState(
    "minBedrooms",
    parseAsString.withDefault(""),
  );
  const [minBathrooms] = useQueryState(
    "minBathrooms",
    parseAsString.withDefault(""),
  );
  const [minArea] = useQueryState("minArea", parseAsString.withDefault(""));
  const [maxArea] = useQueryState("maxArea", parseAsString.withDefault(""));
  const [floorNumber] = useQueryState(
    "floorNumber",
    parseAsString.withDefault(""),
  );
  const [totalFloors] = useQueryState(
    "totalFloors",
    parseAsString.withDefault(""),
  );

  // Furnishing
  const [selectedFurnishing] = useQueryState(
    "furnishing",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Amenities
  const [selectedAmenities] = useQueryState(
    "amenities",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Shared Property
  const [isShared] = useQueryState("isShared", parseAsBoolean.withDefault(false));
  const [selectedSharingTypes] = useQueryState(
    "sharingType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedPreferredTenantTypes] = useQueryState(
    "preferredTenantType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Policies
  const [smokingAllowed] = useQueryState(
    "smokingAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [petsAllowed] = useQueryState(
    "petsAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [guestsAllowed] = useQueryState(
    "guestsAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [sublettingAllowed] = useQueryState(
    "sublettingAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [partiesAllowed] = useQueryState(
    "partiesAllowed",
    parseAsBoolean.withDefault(false),
  );
  const [quietHours] = useQueryState(
    "quietHours",
    parseAsBoolean.withDefault(false),
  );
  const [maintenanceResponsibility] = useQueryState(
    "maintenanceResponsibility",
    parseAsBoolean.withDefault(false),
  );

  // Availability
  const [minLeaseLength] = useQueryState(
    "minLeaseLength",
    parseAsString.withDefault(""),
  );
  const [maxLeaseLength] = useQueryState(
    "maxLeaseLength",
    parseAsString.withDefault(""),
  );
  const [availableFrom] = useQueryState(
    "availableFrom",
    parseAsString.withDefault(""),
  );

  // Payment
  const [selectedPaymentFrequencies] = useQueryState(
    "paymentFrequency",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [utilitiesIncluded] = useQueryState(
    "utilitiesIncluded",
    parseAsBoolean.withDefault(false),
  );

  // Sort & View
  const [sortOption] = useQueryState("sort", parseAsString.withDefault("new-first"));
  const [viewMode] = useQueryState("view", parseAsString.withDefault("grid"));

  // Pagination
  const [currentPageStr, setCurrentPageStr] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const currentPage = Number(currentPageStr) || 1;
  const setCurrentPage = (page: number) => {
    setCurrentPageStr(page.toString());
  };

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    let filtered = properties.filter((property) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          property.title?.toLowerCase().includes(searchLower) ||
          property.address?.toLowerCase().includes(searchLower) ||
          property.city?.toLowerCase().includes(searchLower) ||
          property.state?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Listing Type filter
      if (
        selectedListingTypes.length > 0 &&
        !selectedListingTypes.includes(property.listingType)
      ) {
        return false;
      }

      // Property Type filter
      if (
        selectedPropertyTypes.length > 0 &&
        !selectedPropertyTypes.includes(property.propertyType)
      ) {
        return false;
      }

      // Location filters
      if (selectedCities.length > 0 && !selectedCities.includes(property.city)) {
        return false;
      }
      if (
        selectedStates.length > 0 &&
        !selectedStates.includes(property.state)
      ) {
        return false;
      }
      if (
        selectedZipCodes.length > 0 &&
        !selectedZipCodes.includes(property.zipCode)
      ) {
        return false;
      }

      // Pricing filters
      if (minPrice && property.price && property.price < Number(minPrice)) {
        return false;
      }
      if (maxPrice && property.price && property.price > Number(maxPrice)) {
        return false;
      }
      if (minRent && property.rent && property.rent < Number(minRent)) {
        return false;
      }
      if (maxRent && property.rent && property.rent > Number(maxRent)) {
        return false;
      }
      if (
        minSecurityDeposit &&
        property.securityDeposit &&
        property.securityDeposit < Number(minSecurityDeposit)
      ) {
        return false;
      }
      if (
        maxSecurityDeposit &&
        property.securityDeposit &&
        property.securityDeposit > Number(maxSecurityDeposit)
      ) {
        return false;
      }

      // Property Details filters
      if (minBedrooms && property.numBedrooms < Number(minBedrooms)) {
        return false;
      }
      if (minBathrooms && property.numBathrooms < Number(minBathrooms)) {
        return false;
      }
      if (minArea && property.area && property.area < Number(minArea)) {
        return false;
      }
      if (maxArea && property.area && property.area > Number(maxArea)) {
        return false;
      }
      if (floorNumber && property.floorNumber !== Number(floorNumber)) {
        return false;
      }
      if (totalFloors && property.totalFloors !== Number(totalFloors)) {
        return false;
      }

      // Furnishing filter
      if (
        selectedFurnishing.length > 0 &&
        !selectedFurnishing.includes(property.furnishing)
      ) {
        return false;
      }

      // Amenities filters
      for (const amenity of selectedAmenities) {
        if (!property[amenity as keyof Property]) {
          return false;
        }
      }

      // Shared Property filters
      if (isShared && !property.isShared) {
        return false;
      }
      if (
        selectedSharingTypes.length > 0 &&
        property.sharingDetails?.sharingType &&
        !selectedSharingTypes.includes(property.sharingDetails.sharingType)
      ) {
        return false;
      }
      if (
        selectedPreferredTenantTypes.length > 0 &&
        property.sharingDetails?.preferredTenantType &&
        !selectedPreferredTenantTypes.includes(
          property.sharingDetails.preferredTenantType,
        )
      ) {
        return false;
      }

      // Policy filters
      if (smokingAllowed && !property.smokingAllowed) {
        return false;
      }
      if (petsAllowed && !property.petsAllowed) {
        return false;
      }
      if (guestsAllowed && !property.guestsAllowed) {
        return false;
      }
      if (sublettingAllowed && !property.sublettingAllowed) {
        return false;
      }
      if (partiesAllowed && !property.partiesAllowed) {
        return false;
      }
      if (quietHours && !property.quietHours) {
        return false;
      }
      if (
        maintenanceResponsibility &&
        !property.maintenanceResponsibility
      ) {
        return false;
      }

      // Availability filters
      if (minLeaseLength && property.leaseLength) {
        if (property.leaseLength < Number(minLeaseLength)) {
          return false;
        }
      }
      if (maxLeaseLength && property.leaseLength) {
        if (property.leaseLength > Number(maxLeaseLength)) {
          return false;
        }
      }
      if (availableFrom && property.availableFrom) {
        if (new Date(property.availableFrom) < new Date(availableFrom)) {
          return false;
        }
      }

      // Payment filters
      if (
        selectedPaymentFrequencies.length > 0 &&
        property.paymentFrequency &&
        !selectedPaymentFrequencies.includes(property.paymentFrequency)
      ) {
        return false;
      }
      if (utilitiesIncluded && !property.utilitiesIncluded) {
        return false;
      }

      return true;
    });

    // Sort properties
    filtered = [...filtered].sort((a, b) => {
      if (sortOption === "new-first") {
        const aTime =
          typeof a.createdAt === "string"
            ? new Date(a.createdAt).getTime()
            : 0;
        const bTime =
          typeof b.createdAt === "string"
            ? new Date(b.createdAt).getTime()
            : 0;
        return bTime - aTime;
      } else if (sortOption === "old-first") {
        const aTime =
          typeof a.createdAt === "string"
            ? new Date(a.createdAt).getTime()
            : 0;
        const bTime =
          typeof b.createdAt === "string"
            ? new Date(b.createdAt).getTime()
            : 0;
        return aTime - bTime;
      } else if (sortOption === "price-low-high") {
        const aPrice = a.price || a.rent || 0;
        const bPrice = b.price || b.rent || 0;
        return aPrice - bPrice;
      } else if (sortOption === "price-high-low") {
        const aPrice = a.price || a.rent || 0;
        const bPrice = b.price || b.rent || 0;
        return bPrice - aPrice;
      } else if (sortOption === "area-large-small") {
        const aArea = a.area || 0;
        const bArea = b.area || 0;
        return bArea - aArea;
      } else if (sortOption === "area-small-large") {
        const aArea = a.area || 0;
        const bArea = b.area || 0;
        return aArea - bArea;
      }
      return 0;
    });

    return filtered;
  }, [
    properties,
    searchTerm,
    selectedListingTypes,
    selectedPropertyTypes,
    selectedCities,
    selectedStates,
    selectedZipCodes,
    minPrice,
    maxPrice,
    minRent,
    maxRent,
    minSecurityDeposit,
    maxSecurityDeposit,
    minBedrooms,
    minBathrooms,
    minArea,
    maxArea,
    floorNumber,
    totalFloors,
    selectedFurnishing,
    selectedAmenities,
    isShared,
    selectedSharingTypes,
    selectedPreferredTenantTypes,
    smokingAllowed,
    petsAllowed,
    guestsAllowed,
    sublettingAllowed,
    partiesAllowed,
    quietHours,
    maintenanceResponsibility,
    minLeaseLength,
    maxLeaseLength,
    availableFrom,
    selectedPaymentFrequencies,
    utilitiesIncluded,
    sortOption,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* Header Skeletons */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        {/* Content Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-destructive/50 bg-destructive/10 p-8 text-center"
        >
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Properties
          </h3>
          <p className="text-muted-foreground">{error.message}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="container mx-auto p-4 md:p-6 space-y-8 max-w-7xl"
    >
      {/* Hero Header */}
      <motion.div variants={scaleIn} className="text-center space-y-4">
        <div className="relative inline-block">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.h1
            className="relative text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Properties
          </motion.h1>
        </div>
        <motion.p
          className="text-muted-foreground text-lg md:text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Find your perfect property
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PropertyFilters properties={properties} />
        </motion.div>

        {/* Properties List */}
        <motion.div
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Search, Sort, and View Controls */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-lg border-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-sm"
          >
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value || null)}
                  className="h-9 pl-9 pr-3 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Sort and View Controls */}
            <PropertySortControls />
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-muted-foreground"
          >
            {filteredProperties.length === 0 ? (
              <span>No properties found</span>
            ) : (
              <span>
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredProperties.length)} of{" "}
                {filteredProperties.length} properties
              </span>
            )}
          </motion.div>

          {/* Properties Grid/List */}
          <AnimatePresence mode="popLayout">
            {paginatedProperties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border/50 bg-muted/30 p-12 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block mb-4"
                >
                  <Home className="h-16 w-16 text-muted-foreground mx-auto" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">
                  No properties found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter terms.
                </p>
              </motion.div>
            ) : (
              <motion.div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-6"
                }
                layout
              >
                {paginatedProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    variants={staggerItem}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-6"
            >
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    if (i === 0 && currentPage > 4 && totalPages > 7) {
                      return (
                        <>
                          <PaginationItem key="first">
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(1);
                              }}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        </>
                      );
                    }

                    if (
                      i === 6 &&
                      currentPage < totalPages - 3 &&
                      totalPages > 7
                    ) {
                      return (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem key="last">
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(totalPages);
                              }}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      );
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

