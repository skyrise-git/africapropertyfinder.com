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
      className="group relative w-80 h-[520px] flex-shrink-0 mx-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-primary/50 flex flex-col">
        {/* Image Section - Fixed Height */}
        <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
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
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge className="bg-primary text-white font-semibold border-0 shadow-md">
              {property.listingType === "sale"
                ? "For Sale"
                : property.listingType === "rent"
                  ? "For Rent"
                  : "Student"}
            </Badge>
            <Badge className="bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 border-0 shadow-md backdrop-blur-sm">
              {property.propertyType?.charAt(0).toUpperCase() +
                property.propertyType?.slice(1)}
            </Badge>
          </div>

          {/* Heart Button */}
          <div className="absolute top-3 right-3">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLiked(!isLiked);
                }}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    isLiked
                      ? "fill-red-500 text-red-500"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                />
              </Button>
            </motion.div>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg border border-white/20">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {displayPrice}
              </span>
            </div>
          </div>

          {/* Rating Badge */}
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-lg border border-white/20">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
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
        <CardContent className="p-5 bg-white dark:bg-gray-900 flex flex-col flex-1 min-h-0">
          {/* Title - Fixed Height */}
          <div className="h-14 mb-3 flex-shrink-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {property.title || "Property Listing"}
            </h3>
          </div>

          {/* Location - Fixed Height */}
          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4 flex-shrink-0 min-h-[20px]">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">
              {property.address && property.city
                ? `${property.address}, ${property.city}`
                : "Location not specified"}
            </span>
          </div>

          {/* Property Details - Fixed Height */}
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-4">
              {property.numBedrooms > 0 ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <Bed className="h-4 w-4 text-primary" />
                  <span className="font-medium">{property.numBedrooms}</span>
                </div>
              ) : (
                <div className="w-12" />
              )}
              {property.numBathrooms > 0 ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <Bath className="h-4 w-4 text-primary" />
                  <span className="font-medium">{property.numBathrooms}</span>
                </div>
              ) : (
                <div className="w-12" />
              )}
              {property.area ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <Square className="h-4 w-4 text-primary" />
                  <span className="font-medium">{property.area}</span>
                </div>
              ) : (
                <div className="w-12" />
              )}
            </div>

            {/* Status Badge */}
            <Badge
              variant="secondary"
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
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
  const cardWidth = 320; // w-80 = 320px
  const gap = 16; // mx-4 = 16px on each side = 32px total gap between cards
  const oneSetWidth = properties.length * (cardWidth + gap * 2);

  return (
    <div
      className="relative w-full overflow-hidden h-[520px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

      <motion.div
        className="flex will-change-transform h-full"
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
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 space-y-12">
          <div className="text-center space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-80 mx-auto" />
            <div className="h-6 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-96 mx-auto" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-80 h-[520px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg flex-shrink-0"
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
    <section className="relative py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.primary)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.primary)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-5" />

      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Star className="h-4 w-4" />
            Premium Selection
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary to-primary/80 dark:from-white dark:via-primary dark:to-primary/90 bg-clip-text text-transparent leading-tight">
            Featured Properties
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover our curated collection of exceptional properties, each
            offering unique features and premium locations.
          </p>
        </motion.div>
      </div>

      {/* Full Width Marquee */}
      <div className="relative z-10 w-full">
        <FullWidthMarquee
          properties={featuredProperties}
          speed={60}
        />
      </div>

      {/* Call to Action */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 mt-20">
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
            className="group bg-primary/90 backdrop-blur-md hover:bg-primary shadow-2xl"
          >
            <Link href="/properties">
              Explore All Properties
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </section>
  );
}
