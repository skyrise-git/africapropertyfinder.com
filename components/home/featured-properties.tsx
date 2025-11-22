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
      className="group relative w-80 flex-shrink-0 mx-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:bg-white/20 group-hover:border-primary/30">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          {property.images && property.images[0] && (
            <>
              <img
                src={property.images[0].url}
                alt={property.title}
                className={`w-full h-full object-cover transition-all duration-1000 ${
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
                } group-hover:scale-110`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-pulse" />
              )}
            </>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Enhanced Hover Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/20 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Top badges with blur background */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground font-semibold border-0 shadow-lg">
              {property.listingType === "sale"
                ? "For Sale"
                : property.listingType === "rent"
                  ? "For Rent"
                  : "Student"}
            </Badge>
            <Badge className="bg-black/50 backdrop-blur-sm text-white border border-white/20 shadow-lg">
              {property.propertyType?.charAt(0).toUpperCase() +
                property.propertyType?.slice(1)}
            </Badge>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40 text-white shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLiked(!isLiked);
                }}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </Button>
            </motion.div>
          </div>

          {/* Enhanced Rating Badge */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 text-white shadow-lg">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">4.8</span>
              <Eye className="h-3 w-3 ml-1" />
              <span className="text-xs">24</span>
            </div>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30 shadow-lg">
              <span className="text-xl font-bold text-white">
                {displayPrice}
              </span>
            </div>
          </div>

          {/* View Property Button - appears on hover */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <Button className="bg-primary/90 backdrop-blur-md text-primary-foreground hover:bg-primary shadow-2xl">
              <Eye className="h-4 w-4 mr-2" />
              View Property
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-6 space-y-4 bg-white/10 backdrop-blur-md">
          {/* Title */}
          <div>
            <h3 className="font-bold text-lg text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {property.title}
            </h3>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <MapPin className="h-4 w-4 text-primary/80" />
            <span className="line-clamp-1">
              {property.address}, {property.city}
            </span>
          </div>

          {/* Property Details */}
          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            <div className="flex items-center gap-4">
              {property.numBedrooms > 0 && (
                <div className="flex items-center gap-1 text-sm text-white/80">
                  <Bed className="h-4 w-4 text-primary/80" />
                  <span>{property.numBedrooms}</span>
                </div>
              )}
              {property.numBathrooms > 0 && (
                <div className="flex items-center gap-1 text-sm text-white/80">
                  <Bath className="h-4 w-4 text-primary/80" />
                  <span>{property.numBathrooms}</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-1 text-sm text-white/80">
                  <Square className="h-4 w-4 text-primary/80" />
                  <span>{property.area}</span>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="text-xs text-white/60">New</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FullWidthMarquee = ({
  properties,
  speed = 50,
  isPaused = false,
}: {
  properties: Property[];
  speed?: number;
  isPaused?: boolean;
}) => {
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
    <div className="relative w-full overflow-hidden">
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

      <motion.div
        className="flex will-change-transform"
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
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {duplicatedProperties.map((property, index) => (
          <Link
            key={`${property.id}-${index}`}
            href={`/properties/${property.id}`}
            className="block"
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
  const [isPaused, setIsPaused] = useState(false);

  const properties = (data as Property[]) || [];

  // Get featured properties with images
  const featuredProperties = properties
    .filter((property) => property.images && property.images.length > 0)
    .slice(0, 12);

  if (loading) {
    return (
      <section className="relative py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 space-y-12">
          <div className="text-center space-y-4">
            <div className="h-12 bg-white/20 animate-pulse rounded w-80 mx-auto" />
            <div className="h-6 bg-white/20 animate-pulse rounded w-96 mx-auto" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-80 h-96 bg-white/20 animate-pulse rounded-3xl flex-shrink-0"
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
    <section
      className="relative py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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
        <motion.div
          animate={{ opacity: isPaused ? 0.8 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <FullWidthMarquee
            properties={featuredProperties}
            speed={60}
            isPaused={isPaused}
          />
        </motion.div>
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
