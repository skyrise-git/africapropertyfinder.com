"use client";

import { useQueryState, parseAsString } from "nuqs";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid3x3, Map, LayoutGrid } from "lucide-react";

export function PropertySortControls() {
  const [sortOption, setSortOption] = useQueryState(
    "sort",
    parseAsString.withDefault("new-first"),
  );

  const [viewMode, setViewMode] = useQueryState(
    "view",
    parseAsString.withDefault("cards"),
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Select value={sortOption} onValueChange={setSortOption}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="new-first">Newest first</SelectItem>
          <SelectItem value="old-first">Oldest first</SelectItem>
          <SelectItem value="price-low-high">
            Price / Rent: Low to high
          </SelectItem>
          <SelectItem value="price-high-low">
            Price / Rent: High to low
          </SelectItem>
          <SelectItem value="area-large-small">
            Area: Largest first
          </SelectItem>
          <SelectItem value="area-small-large">
            Area: Smallest first
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-1 rounded-full border border-border/60 bg-muted/40 p-0.5 text-xs w-fit">
        <motion.button
          type="button"
          onClick={() => setViewMode("cards")}
          className={cn(
            "relative rounded-full px-3 py-1 font-medium transition-all duration-300",
            viewMode === "cards"
              ? "text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {viewMode === "cards" && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/80"
              layoutId="propertiesViewToggle"
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            />
          )}
          <span className="relative z-10 inline-flex items-center gap-1.5">
            <Grid3x3 className="h-4 w-4" />
            Cards
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setViewMode("map")}
          className={cn(
            "relative rounded-full px-3 py-1 font-medium transition-all duration-300",
            viewMode === "map"
              ? "text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {viewMode === "map" && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/80"
              layoutId="propertiesViewToggle"
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            />
          )}
          <span className="relative z-10 inline-flex items-center gap-1.5">
            <Map className="h-4 w-4" />
            Map
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setViewMode("split")}
          className={cn(
            "relative rounded-full px-3 py-1 font-medium transition-all duration-300",
            viewMode === "split"
              ? "text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {viewMode === "split" && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/80"
              layoutId="propertiesViewToggle"
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            />
          )}
          <span className="relative z-10 inline-flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Split
          </span>
        </motion.button>
      </div>
    </div>
  );
}


