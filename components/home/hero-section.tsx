"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, MapPin, Home, Building, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyLocationSearch } from "@/components/home/property-location-search";
import type { ListingType, PropertyType } from "@/lib/types/property.type";

interface LocationData {
  lat: string;
  lng: string;
  label: string;
}

const listingTypes: {
  value: ListingType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "sale", label: "Buy", icon: <Home className="h-4 w-4" /> },
  { value: "rent", label: "Rent", icon: <Building className="h-4 w-4" /> },
  {
    value: "student-housing",
    label: "Student Housing",
    icon: <GraduationCap className="h-4 w-4" />,
  },
];

const propertyTypes: { value: PropertyType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
  { value: "other", label: "Other" },
];

export function HeroSection() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListingType, setSelectedListingType] =
    useState<ListingType>("rent");
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    PropertyType | "all"
  >("all");
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);

    try {
      // Build search params
      const params = new URLSearchParams();

      // Add search term if provided
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      // Add listing type filter
      if (selectedListingType) {
        params.set("listingType", selectedListingType);
      }

      // Add property type filter if not "all"
      if (selectedPropertyType && selectedPropertyType !== "all") {
        params.set("propertyType", selectedPropertyType);
      }

      // Add location data if selected
      if (selectedLocation) {
        params.set("lat", selectedLocation.lat);
        params.set("lng", selectedLocation.lng);
        params.set("loc", selectedLocation.label);
      }

      // Navigate to properties page with filters
      const queryString = params.toString();
      router.push(`/properties${queryString ? `?${queryString}` : ""}`);

      setTimeout(() => setIsSearching(false), 1000);
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        "Something went wrong with your search. Please try again.",
      );
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location: LocationData | null) => {
    setSelectedLocation(location);
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-primary/8 to-primary/12 dark:from-background dark:via-primary/10 dark:to-primary/15 w-full max-w-full">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.primary)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.primary)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-4 md:top-20 md:left-10 w-16 h-16 md:w-32 md:h-32 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-32 right-4 md:top-40 md:right-20 w-12 h-12 md:w-24 md:h-24 bg-primary/15 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-8 md:left-1/4 w-10 h-10 md:w-20 md:h-20 bg-primary/10 rounded-full blur-xl animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-8 md:right-1/3 w-14 h-14 md:w-28 md:h-28 bg-primary/25 rounded-full blur-xl animate-pulse delay-3000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-full px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 sm:py-6 md:py-8 lg:py-12 xl:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 xl:space-y-8 w-full"
        >
          {/* Hero Text */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
              <span className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm">Find Your Dream Property</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary to-primary/80 dark:from-white dark:via-primary dark:to-primary/90 bg-clip-text text-transparent leading-tight px-1 sm:px-2 break-words"
            >
              Africa Property Finder
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-snug sm:leading-relaxed px-1 sm:px-2 md:px-4"
            >
              Discover your perfect home with our advanced search technology.
              From luxury apartments to cozy studios, find exactly what you're
              looking for.
            </motion.p>
          </div>

          {/* Glassmorphism Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-4xl mx-auto w-full"
          >
            <div className="p-2.5 sm:p-3 md:p-4 lg:p-5 xl:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-2xl w-full">
              {/* Listing Type Tabs */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 mb-3 sm:mb-3.5 md:mb-4 lg:mb-5 justify-center">
                {listingTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedListingType(type.value)}
                    className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-full text-[10px] sm:text-xs md:text-sm lg:text-base font-medium transition-all duration-300 ${
                      selectedListingType === type.value
                        ? "bg-primary/20 backdrop-blur-md text-primary dark:text-primary shadow-lg border border-primary/40"
                        : "bg-white/10 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white/20 border border-white/20"
                    }`}
                  >
                    {type.icon}
                    <span className="hidden sm:inline">{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 items-end">
                {/* Location Search */}
                <div className="sm:col-span-2 lg:col-span-2 space-y-1 sm:space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <PropertyLocationSearch
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div className="sm:col-span-1 lg:col-span-1 space-y-1 sm:space-y-1.5 md:space-y-2 w-full">
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                    Property Type
                  </label>
                  <div className="w-full">
                    <Select
                      value={selectedPropertyType}
                      onValueChange={(value) =>
                        setSelectedPropertyType(value as PropertyType | "all")
                      }
                    >
                      <SelectTrigger className="w-full h-8 sm:h-9 md:h-10 text-[10px] sm:text-xs md:text-sm bg-white/50 backdrop-blur-sm border-white/30 text-gray-700 dark:text-gray-300 min-w-0 flex-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-lg border-white/30 min-w-[var(--radix-select-trigger-width)]">
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search Term */}
                <div className="sm:col-span-1 lg:col-span-1 space-y-1 sm:space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                    Keywords
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="City, neighborhood..."
                      className="h-8 sm:h-9 md:h-10 pl-8 sm:pl-10 text-[10px] sm:text-xs md:text-sm bg-white/50 backdrop-blur-sm border-white/30 text-gray-700 dark:text-gray-300 placeholder:text-gray-500"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full h-8 sm:h-9 md:h-10 text-[10px] sm:text-xs md:text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="hidden sm:inline">Searching...</span>
                        <span className="sm:hidden">...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Search
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {searchError && (
                <div className="mt-4 p-3 bg-destructive/10 backdrop-blur-sm border border-destructive/20 rounded-lg text-destructive text-sm">
                  {searchError}
                </div>
              )}

              {/* Quick Stats */}
              <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-white/20">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="whitespace-nowrap">10,000+ Properties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/80 rounded-full"></div>
                    <span className="whitespace-nowrap">Real-time Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                    <span className="whitespace-nowrap">Expert Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto px-2 sm:px-4 mt-4 sm:mt-6"
          >
            Join thousands of satisfied customers who found their dream homes
            with us
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-900/50 backdrop-blur-sm" />
    </section>
  );
}
