"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Star,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirebaseRealtime } from "@/hooks/use-firebase-realtime";
import type { Property } from "@/lib/types/property.type";
import Link from "next/link";

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

  const displayPrice =
    property.listingType === "sale"
      ? formatPrice(property.price, property.listingType)
      : formatPrice(property.rent, property.listingType);

  return (
    <div
      className="group relative w-[240px] sm:w-[260px] md:w-[280px] lg:w-80 h-[400px] sm:h-[440px] md:h-[480px] lg:h-[520px] flex-shrink-0 mx-2 sm:mx-3 md:mx-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-primary/50 flex flex-col">
        {/* Image Section - Fixed Height */}
        <div className="relative h-48 sm:h-52 md:h-56 lg:h-64 overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          {property.images && property.images[0] ? (
            <>
              <img
                src={property.images[0].url}
                alt={property.title}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
                } group-hover:scale-110`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <Square className="h-16 w-16 text-gray-400 dark:text-gray-600" />
            </div>
          )}

          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Hover Overlay */}
          <motion.div
            className="absolute inset-0 bg-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Top badges */}
          <div className="absolute top-2 sm:top-2.5 md:top-3 left-2 sm:left-2.5 md:left-3 flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
            <Badge className="bg-primary text-white font-semibold border-0 shadow-md text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1">
              {property.listingType === "sale"
                ? "For Sale"
                : property.listingType === "rent"
                  ? "For Rent"
                  : "Student"}
            </Badge>
            <Badge className="bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 border-0 shadow-md backdrop-blur-sm text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1">
              {property.propertyType?.charAt(0).toUpperCase() +
                property.propertyType?.slice(1)}
            </Badge>
          </div>

          {/* Heart Button */}
          <div className="absolute top-2 sm:top-2.5 md:top-3 right-2 sm:right-2.5 md:right-3">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLiked(!isLiked);
                }}
              >
                <Heart
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 transition-colors ${
                    isLiked
                      ? "fill-red-500 text-red-500"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                />
              </Button>
            </motion.div>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-2 sm:bottom-2.5 md:bottom-3 left-2 sm:left-2.5 md:left-3">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-md sm:rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 shadow-lg border border-white/20">
              <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white">
                {displayPrice}
              </span>
            </div>
          </div>

          {/* Rating Badge */}
          <div className="absolute bottom-2 sm:bottom-2.5 md:bottom-3 right-2 sm:right-2.5 md:right-3">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-md sm:rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg border border-white/20">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                4.8
              </span>
            </div>
          </div>

          {/* View Property Button - appears on hover */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-xl">
              <Eye className="h-4 w-4 mr-2" />
              View Property
            </Button>
          </motion.div>
        </div>

        {/* Content Section - Fixed Height with Flex */}
        <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5 bg-white dark:bg-gray-900 flex flex-col flex-1 min-h-0">
          {/* Title - Fixed Height */}
          <div className="h-10 sm:h-12 md:h-14 mb-1.5 sm:mb-2 md:mb-3 flex-shrink-0">
            <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {property.title || "Property Listing"}
            </h3>
          </div>

          {/* Location - Fixed Height */}
          <div className="flex items-start gap-1 sm:gap-1.5 md:gap-2 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 md:mb-4 flex-shrink-0 min-h-[18px] sm:min-h-[20px]">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">
              {property.address && property.city
                ? `${property.address}, ${property.city}`
                : "Location not specified"}
            </span>
          </div>

          {/* Property Details - Fixed Height */}
          <div className="flex items-center justify-between pt-2 sm:pt-2.5 md:pt-3 lg:pt-4 mt-auto border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
              {property.numBedrooms > 0 ? (
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300">
                  <Bed className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                  <span className="font-medium">{property.numBedrooms}</span>
                </div>
              ) : (
                <div className="w-6 sm:w-8 md:w-12" />
              )}
              {property.numBathrooms > 0 ? (
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300">
                  <Bath className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                  <span className="font-medium">{property.numBathrooms}</span>
                </div>
              ) : (
                <div className="w-6 sm:w-8 md:w-12" />
              )}
              {property.area ? (
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300">
                  <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                  <span className="font-medium">{property.area}</span>
                </div>
              ) : (
                <div className="w-6 sm:w-8 md:w-12" />
              )}
            </div>

            {/* Status Badge */}
            <Badge
              variant="secondary"
              className="text-[9px] sm:text-[10px] md:text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 sm:px-2 py-0.5"
            >
              New
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FullWidthMarquee = ({
  properties,
  speed = 50,
}: {
  properties: Property[];
  speed?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Duplicate properties multiple times for seamless infinite scroll
  const duplicatedProperties = useMemo(
    () => [...properties, ...properties, ...properties],
    [properties],
  );

  // Calculate the width of one set of properties
  // Using average: mobile ~296px (280px + 16px gap), desktop ~352px (320px + 32px gap)
  const cardWidth = 320; // Base width for calculation
  const gap = 16; // Base gap
  const oneSetWidth = properties.length * (cardWidth + gap * 2);

  return (
    <div
      className="relative w-full max-w-full overflow-x-hidden overflow-y-visible h-[400px] sm:h-[440px] md:h-[480px] lg:h-[520px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

      <motion.div
        className="flex will-change-transform h-full overflow-visible"
        animate={{
          x: [0, -oneSetWidth],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        style={{
          animationPlayState: isHovered ? "paused" : "running",
        }}
      >
        {duplicatedProperties.map((property, index) => (
          <Link
            key={`${property.id}-${index}`}
            href={`/properties/${property.id}`}
            className="block h-full"
          >
            <PropertyCard property={property} index={index} />
          </Link>
        ))}
      </motion.div>
    </div>
  );
};

export function FeaturedProperties() {
  const { data, loading, error } = useFirebaseRealtime<Property>("properties");

  const properties = (data as Property[]) || [];

  // Get featured properties with images
  const featuredProperties = properties
    .filter((property) => property.images && property.images.length > 0)
    .slice(0, 12);

  if (loading) {
    return (
      <section className="relative py-10 sm:py-12 md:py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 overflow-hidden w-full max-w-full">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 space-y-6 sm:space-y-8 md:space-y-12 w-full">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="h-7 sm:h-8 md:h-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-56 sm:w-64 md:w-80 mx-auto" />
            <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-64 sm:w-72 md:w-96 mx-auto" />
          </div>
          <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-[240px] sm:w-[260px] md:w-[280px] lg:w-80 h-[400px] sm:h-[440px] md:h-[480px] lg:h-[520px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg flex-shrink-0"
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
    <section className="relative py-6 sm:py-8 md:py-10 lg:py-12 xl:py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 overflow-hidden w-full max-w-full">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.primary)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.primary)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-5" />

      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-96 lg:h-96 bg-primary/15 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-4 md:px-5 lg:px-6 mb-4 sm:mb-6 md:mb-8 lg:mb-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6"
        >
          <div className="inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-1.5 lg:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
            Premium Selection
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary to-primary/80 dark:from-white dark:via-primary dark:to-primary/90 bg-clip-text text-transparent leading-tight px-1 sm:px-2">
            Featured Properties
          </h2>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-snug sm:leading-relaxed px-1 sm:px-2">
            Discover our curated collection of exceptional properties, each
            offering unique features and premium locations.
          </p>
        </motion.div>
      </div>

      {/* Full Width Marquee */}
      <div className="relative z-10 w-full max-w-full overflow-x-hidden">
        <FullWidthMarquee
          properties={featuredProperties}
          speed={60}
        />
      </div>

      {/* Call to Action */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-4 md:px-5 lg:px-6 mt-6 sm:mt-8 md:mt-12 lg:mt-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Button
            asChild
            size="lg"
            className="group bg-primary/90 backdrop-blur-md hover:bg-primary shadow-2xl text-[10px] sm:text-xs md:text-sm lg:text-base px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3"
          >
            <Link href="/properties">
              <span className="whitespace-nowrap">Explore All Properties</span>
              <ArrowRight className="ml-1 sm:ml-1.5 md:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </section>
  );
}
