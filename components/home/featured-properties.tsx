"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafetyBadge } from "@/components/safety/safety-badge";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { useCrimeData } from "@/contexts/crime-data-context";
import { matchPropertyToStation } from "@/lib/utils/crime-helpers";
import type { Property } from "@/lib/types/property.type";
import Link from "next/link";
import Image from "next/image";

const formatPrice = (price: number | undefined, listingType: string) => {
  if (!price) return "Contact for price";

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return listingType === "rent" ? `${formatted}/mo` : formatted;
};

const PropertyCard = ({
  property,
  index,
}: {
  property: Property;
  index: number;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { allStations } = useCrimeData();

  const matchedStation = allStations.length > 0
    ? matchPropertyToStation(allStations, property.city, property.state, property.address, property.country)
    : undefined;

  const displayPrice =
    property.listingType === "sale"
      ? formatPrice(property.price, property.listingType)
      : formatPrice(property.rent, property.listingType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:border-primary/30 flex flex-col rounded-xl">
        <div className="relative h-52 md:h-56 overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          {property.images && property.images[0] ? (
            <>
              <Image
                src={property.images[0].url}
                alt={property.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className={`w-full h-full object-cover transition-all duration-500 ${
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
                } group-hover:scale-105`}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <Square className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge className="bg-primary text-white font-medium border-0 shadow-sm text-[10px] px-2 py-0.5 rounded-md">
              {property.listingType === "sale"
                ? "For Sale"
                : property.listingType === "rent"
                  ? "For Rent"
                  : "Student"}
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLiked(!isLiked);
                }}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${
                    isLiked
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                />
              </Button>
            </motion.div>
          </div>

          <div className="absolute bottom-2 sm:bottom-2.5 md:bottom-3 left-2 sm:left-2.5 md:left-3">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-md sm:rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 shadow-lg border border-white/20">
              <span className="text-sm sm:text-base md:text-lg font-semibold text-slate-700 dark:text-white">
                {displayPrice}
              </span>
            </div>
          </div>

          {matchedStation && (
            <div className="absolute bottom-3 right-3" onClick={(e) => e.preventDefault()}>
              <SafetyBadge station={matchedStation} compact />
            </div>
          )}

          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button size="sm" className="bg-white text-slate-800 hover:bg-gray-50 shadow-lg font-medium">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View Details
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5 bg-white dark:bg-gray-900 flex flex-col flex-1 min-h-0">
          <div className="h-10 sm:h-12 md:h-14 mb-1.5 sm:mb-2 md:mb-3 flex-shrink-0">
            <h3 className="font-medium text-sm sm:text-base md:text-lg text-slate-700 dark:text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {property.title || "Property Listing"}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 text-xs mb-3">
            <MapPin className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.address && property.city
                ? `${property.address}, ${property.city}`
                : "Location not specified"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {property.numBedrooms > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-gray-300">
                  <Bed className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">{property.numBedrooms}</span>
                </div>
              )}
              {property.numBathrooms > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-gray-300">
                  <Bath className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">{property.numBathrooms}</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-gray-300">
                  <Square className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">{Number(property.area).toLocaleString()} ft²</span>
                </div>
              )}
            </div>

            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              {property.propertyType}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function FeaturedProperties() {
  const { data, loading, error } = useSupabaseRealtime<Property>("properties", {
    realtime: false,
  });

  const properties = data || [];

  const featuredProperties = properties
    .filter((property) => property.images && property.images.length > 0)
    .slice(0, 12);

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-8">
          <div className="text-center space-y-3">
            <div className="h-8 md:h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg w-64 md:w-80 mx-auto" />
            <div className="h-5 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg w-80 md:w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[380px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || featuredProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary tracking-wide uppercase">
              Featured Listings
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-700 dark:text-gray-100 tracking-tight">
              Discover Your Next Home
            </h2>
            <p className="text-slate-400 dark:text-gray-400 text-sm md:text-base max-w-lg">
              Handpicked properties across Africa, each with safety insights and premium features.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="group border-primary/30 text-primary hover:bg-primary/5 self-start sm:self-auto"
          >
            <Link href="/properties">
              View All Properties
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProperties.slice(0, 8).map((property, index) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="block"
            >
              <PropertyCard property={property} index={index} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
