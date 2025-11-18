"use client";

import { MapPin, BedDouble, Bath, Home, Maximize2, PawPrint } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Property } from "@/lib/types/property.type";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  href?: string;
  onHoverChange?: (hovered: boolean) => void;
  isHighlighted?: boolean;
}

const listingTypeLabel: Record<Property["listingType"], string> = {
  sale: "For Sale",
  rent: "For Rent",
  "student-housing": "Student Housing",
};

function formatPrice(property: Property) {
  if (property.listingType === "sale" && property.price != null) {
    return `₹${property.price.toLocaleString("en-IN")}`;
  }

  if (
    (property.listingType === "rent" ||
      property.listingType === "student-housing") &&
    property.rent != null
  ) {
    return `₹${property.rent.toLocaleString("en-IN")}${
      property.paymentFrequency ? ` / ${property.paymentFrequency}` : ""
    }`;
  }

  return "Price on request";
}

export function PropertyCard({
  property,
  href,
  onHoverChange,
  isHighlighted,
}: PropertyCardProps) {
  const imageUrl = property.images?.[0]?.url;

  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onHoverStart={() => onHoverChange?.(true)}
      onHoverEnd={() => onHoverChange?.(false)}
      className={cn(
        "h-full",
        isHighlighted
          ? "ring-2 ring-primary/70 ring-offset-2 ring-offset-background"
          : "",
      )}
    >
      <Card className="group h-full overflow-hidden border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-card/60 shadow-sm transition-all duration-300 hover:shadow-xl">
        {imageUrl && (
          <div className="relative h-56 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />

            <img
              src={imageUrl}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />

            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
              <Badge
                variant="secondary"
                className="bg-black/60 px-2 py-1 text-[11px] font-medium uppercase tracking-wide"
              >
                {listingTypeLabel[property.listingType]}
              </Badge>

              <span className="rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium">
                {formatPrice(property)}
              </span>
            </div>
          </div>
        )}

        <CardHeader className="space-y-3">
          <CardTitle className="line-clamp-2 text-lg font-semibold tracking-tight">
            {property.title}
          </CardTitle>

          <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            <span className="truncate">
              {property.propertyType.replace("-", " ")} •{" "}
              {property.furnishing.replace("-", " ")}
            </span>
          </CardDescription>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              {property.address}
              {", "}
              {property.city}
              {property.state ? `, ${property.state}` : ""}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 pb-5">
          <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <BedDouble className="h-4 w-4 text-primary" />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">
                  {property.numBedrooms ?? "-"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Beds
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <Bath className="h-4 w-4 text-primary" />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">
                  {property.numBathrooms ?? "-"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Baths
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <Maximize2 className="h-4 w-4 text-primary" />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">
                  {property.area ? `${property.area} sq ft` : "—"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Area
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {property.parkingAvailable && (
              <Badge variant="secondary" className="text-[11px]">
                Parking
              </Badge>
            )}
            {property.wifi && (
              <Badge variant="secondary" className="text-[11px]">
                Wi‑Fi
              </Badge>
            )}
            {property.petsAllowed && (
              <Badge variant="secondary" className="text-[11px]">
                <PawPrint className="mr-1 h-3 w-3" />
                Pets allowed
              </Badge>
            )}
            {property.pool && (
              <Badge variant="secondary" className="text-[11px]">
                Pool
              </Badge>
            )}
            {property.gym && (
              <Badge variant="secondary" className="text-[11px]">
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


