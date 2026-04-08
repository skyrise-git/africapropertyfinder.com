"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Property } from "@/lib/types/property.type";
import { formatCurrency } from "@ashirbad/js-core";
import {
  Bath,
  BedDouble,
  Home,
  MapPin,
  Maximize2,
  PawPrint,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";
import { SafetyBadge } from "@/components/safety/safety-badge";
import { matchPropertyToStation } from "@/lib/utils/crime-helpers";
import { useCrimeData } from "@/contexts/crime-data-context";

interface PropertyCardProps {
  property: Property;
  href?: string;
}

const listingTypeLabel: Record<Property["listingType"], string> = {
  sale: "FOR SALE",
  rent: "FOR RENT",
  "student-housing": "STUDENT HOUSING",
};

function formatPrice(property: Property) {
  if (property.listingType === "sale" && property.price != null) {
    try {
      return formatCurrency(property.price, "USD");
    } catch {
      // Fallback if formatCurrency is not available
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property.price);
    }
  }

  if (
    (property.listingType === "rent" ||
      property.listingType === "student-housing") &&
    property.rent != null
  ) {
    try {
      const formatted = formatCurrency(property.rent, "USD");
      return `${formatted}${
        property.paymentFrequency
          ? ` / ${property.paymentFrequency}`
          : " / monthly"
      }`;
    } catch {
      // Fallback if formatCurrency is not available
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property.rent);
      return `${formatted}${
        property.paymentFrequency
          ? ` / ${property.paymentFrequency}`
          : " / monthly"
      }`;
    }
  }

  return "Price on request";
}

export function PropertyCard({ property, href }: PropertyCardProps) {
  const imageUrl = property.images?.[0]?.url;
  const { stations } = useCrimeData();

  const safetyStation = useMemo(
    () => matchPropertyToStation(stations, property.city, property.state, property.address, property.country),
    [stations, property.city, property.state, property.address, property.country]
  );

  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-lg">
        {imageUrl && (
          <div className="relative h-40 sm:h-48 md:h-56 w-full overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-100 opacity-90" />

            <img
              src={imageUrl}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
            />

            <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-4">
              <Badge
                variant="destructive"
                className="bg-destructive/90 backdrop-blur-sm px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide shadow-lg"
              >
                {listingTypeLabel[property.listingType]}
              </Badge>

              <span className="rounded-md bg-black/80 backdrop-blur-sm px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-white shadow-lg">
                {formatPrice(property)}
              </span>
            </div>
          </div>
        )}

        <CardHeader className="space-y-1.5 sm:space-y-2 px-4 sm:px-5 pt-3 sm:pt-4">
          <CardTitle className="line-clamp-2 text-base sm:text-lg font-medium text-slate-700 dark:text-gray-100 tracking-tight leading-tight">
            {property.title}
          </CardTitle>

          <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="truncate">
              {property.propertyType.toUpperCase().replace("-", " ")} •{" "}
              {property.furnishing.toUpperCase().replace("-", " ")}
            </span>
          </CardDescription>

          <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5 text-primary" />
            <span className="line-clamp-2 leading-snug">
              {property.address}
              {property.city && `, ${property.city}`}
              {property.state && `, ${property.state}`}
            </span>
          </div>
          {safetyStation && (
            <div className="mt-1">
              <SafetyBadge station={safetyStation} compact />
            </div>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2 sm:gap-2.5 px-4 sm:px-5 pb-3 sm:pb-4">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 sm:py-2 transition-colors hover:bg-muted/50">
              <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mx-auto sm:mx-0" />
              <div className="flex flex-col items-center sm:items-start leading-tight">
                <span className="text-xs sm:text-sm font-semibold">
                  {property.numBedrooms ?? "-"}
                </span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  Beds
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 sm:py-2 transition-colors hover:bg-muted/50">
              <Bath className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mx-auto sm:mx-0" />
              <div className="flex flex-col items-center sm:items-start leading-tight">
                <span className="text-xs sm:text-sm font-semibold">
                  {property.numBathrooms ?? "-"}
                </span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  Baths
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 sm:py-2 transition-colors hover:bg-muted/50">
              <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mx-auto sm:mx-0" />
              <div className="flex flex-col items-center sm:items-start leading-tight min-w-0">
                <span className="text-xs sm:text-sm font-semibold truncate w-full text-center sm:text-left">
                  {property.area
                    ? `${property.area.toLocaleString("en-US")} sq ft`
                    : "—"}
                </span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  Area
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {property.parkingAvailable && (
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-[11px] px-2 py-0.5"
              >
                Parking
              </Badge>
            )}
            {property.wifi && (
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-[11px] px-2 py-0.5"
              >
                Wi‑Fi
              </Badge>
            )}
            {property.petsAllowed && (
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-[11px] px-2 py-0.5"
              >
                <PawPrint className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Pets
              </Badge>
            )}
            {property.pool && (
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-[11px] px-2 py-0.5"
              >
                Pool
              </Badge>
            )}
            {property.gym && (
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-[11px] px-2 py-0.5"
              >
                Gym
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
