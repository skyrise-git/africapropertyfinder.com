"use client";

import { useMemo, forwardRef } from "react";
import { motion } from "motion/react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryState, parseAsArrayOf, parseAsBoolean, parseAsString } from "nuqs";

interface FilterFABProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const FilterFAB = forwardRef<HTMLDivElement, FilterFABProps>(
  ({ isOpen, onToggle }, ref) => {
    const [listingType] = useQueryState(
      "listingType",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [propertyType] = useQueryState(
      "propertyType",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [furnishing] = useQueryState(
      "furnishing",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [city] = useQueryState(
      "city",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [state] = useQueryState(
      "state",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [minPrice] = useQueryState(
      "minPrice",
      parseAsString.withDefault(""),
    );
    const [maxPrice] = useQueryState(
      "maxPrice",
      parseAsString.withDefault(""),
    );
    const [minBedrooms] = useQueryState(
      "minBedrooms",
      parseAsString.withDefault(""),
    );
    const [minBathrooms] = useQueryState(
      "minBathrooms",
      parseAsString.withDefault(""),
    );
    const [minArea] = useQueryState(
      "minArea",
      parseAsString.withDefault(""),
    );
    const [maxArea] = useQueryState(
      "maxArea",
      parseAsString.withDefault(""),
    );
    const [amenities] = useQueryState(
      "amenities",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [policies] = useQueryState(
      "policies",
      parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [petsOnly] = useQueryState(
      "petsAllowed",
      parseAsBoolean.withDefault(false),
    );

    const activeFilterCount = useMemo(() => {
      let count = 0;
      if (listingType.length > 0) count += listingType.length;
      if (propertyType.length > 0) count += propertyType.length;
      if (furnishing.length > 0) count += furnishing.length;
      if (city.length > 0) count += city.length;
      if (state.length > 0) count += state.length;
      if (minPrice) count += 1;
      if (maxPrice) count += 1;
      if (minBedrooms) count += 1;
      if (minBathrooms) count += 1;
      if (minArea) count += 1;
      if (maxArea) count += 1;
      if (amenities.length > 0) count += amenities.length;
      if (policies.length > 0) count += policies.length;
      if (petsOnly) count += 1;
      return count;
    }, [
      listingType,
      propertyType,
      furnishing,
      city,
      state,
      minPrice,
      maxPrice,
      minBedrooms,
      minBathrooms,
      minArea,
      maxArea,
      amenities,
      policies,
      petsOnly,
    ]);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={onToggle}
          size="lg"
          className="relative h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Filter className="h-5 w-5" />
            )}
          </motion.div>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1"
            >
              <Badge
                variant="destructive"
                className="flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs font-bold"
              >
                {activeFilterCount > 9 ? "9+" : activeFilterCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </motion.div>
    );
  },
);

FilterFAB.displayName = "FilterFAB";

