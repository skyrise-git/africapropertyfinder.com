"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Property } from "@/lib/types/property.type";
import { MapPin, Bed, Bath, Square, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { cardVariants } from "@/lib/utils/motion-variants";
import { format } from "date-fns";

interface PropertyCardProps {
  property: Property;
}

const listingTypeLabels: Record<Property["listingType"], string> = {
  sale: "For Sale",
  rent: "For Rent",
  "student-housing": "Student Housing",
};

const listingTypeColors: Record<Property["listingType"], string> = {
  sale: "bg-green-500/20 text-green-700 dark:text-green-400",
  rent: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  "student-housing": "bg-purple-500/20 text-purple-700 dark:text-purple-400",
};

export function PropertyCard({ property }: PropertyCardProps) {
  const mainImage = property.images?.[0]?.url;
  const priceDisplay =
    property.listingType === "sale"
      ? property.price
        ? `$${property.price.toLocaleString()}`
        : "Price on request"
      : property.rent
        ? `$${property.rent.toLocaleString()}/${
            property.paymentFrequency === "weekly"
              ? "week"
              : property.paymentFrequency === "yearly"
                ? "year"
                : "month"
          }`
        : "Rent on request";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="h-full"
    >
      <Link href={`/properties/${property.id}`}>
        <Card className="group h-full cursor-pointer overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card/80 via-card/50 to-card/30 backdrop-blur-sm hover:border-primary/50 hover:shadow-2xl transition-all duration-500 ease-out flex flex-col relative">
          {/* Cover Image with Zoom Effect */}
          {mainImage && (
            <div className="relative h-56 w-full overflow-hidden">
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-10" />

              {/* Image with Scale on Hover */}
              <img
                src={mainImage}
                alt={property.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Listing Type Badge */}
              <motion.div
                className="absolute top-4 left-4 z-20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <Badge
                  className={`${listingTypeColors[property.listingType]} shadow-lg`}
                >
                  {listingTypeLabels[property.listingType]}
                </Badge>
              </motion.div>

              {/* Image Count Badge */}
              {property.images && property.images.length > 1 && (
                <motion.div
                  className="absolute top-4 right-4 z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge variant="secondary" className="shadow-lg">
                    {property.images.length} photos
                  </Badge>
                </motion.div>
              )}
            </div>
          )}

          {/* Content */}
          <CardHeader className="flex-1 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <motion.h3
                className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                {property.title}
              </motion.h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">
                {property.address}, {property.city}, {property.state}
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="space-y-3">
              {/* Price */}
              <div className="text-2xl font-bold text-primary">
                {priceDisplay}
              </div>

              {/* Property Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>{property.numBedrooms} bed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span>{property.numBathrooms} bath</span>
                </div>
                {property.area && (
                  <div className="flex items-center gap-1">
                    <Square className="h-4 w-4" />
                    <span>{property.area.toLocaleString()} sq ft</span>
                  </div>
                )}
              </div>

              {/* Property Type & Furnishing */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {property.propertyType}
                </Badge>
                <Badge variant="secondary" className="capitalize text-xs">
                  {property.furnishing.replace("-", " ")}
                </Badge>
                {property.availableFrom && (
                  <Badge variant="secondary" className="text-xs">
                    Available{" "}
                    {format(new Date(property.availableFrom), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>
            </div>

            {/* View Details Link */}
            <motion.div
              className="flex items-center gap-1 text-primary font-semibold text-sm mt-auto"
              whileHover={{ gap: 6 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <span>View details</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </motion.div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

