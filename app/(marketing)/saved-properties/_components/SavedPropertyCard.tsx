"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Calendar, Heart, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { savedPropertyService } from "@/lib/services/saved-property.service";
import { toast } from "sonner";
import type { Property } from "@/lib/types/property.type";
import type { SavedProperty } from "@/lib/types/saved-property.type";

type SavedPropertyCardProps = {
  savedProperty: SavedProperty;
  property: Property;
  userId: string;
  onUnsave: () => void;
};

export function SavedPropertyCard({
  savedProperty,
  property,
  userId,
  onUnsave,
}: SavedPropertyCardProps) {
  const handleUnsave = async () => {
    try {
      await savedPropertyService.unsave(userId, property.id);
      toast.success("Property removed from saved");
      onUnsave();
    } catch (error) {
      console.error("Error unsaving property:", error);
      toast.error("Failed to remove property. Please try again.");
    }
  };

  const priceDisplay =
    property.listingType === "sale"
      ? property.price
        ? `$${property.price.toLocaleString()}`
        : "Price on request"
      : property.rent
        ? `$${property.rent.toLocaleString()}/mo`
        : "Rent on request";

  return (
    <Card className="border-muted">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-base md:text-lg">{property.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {property.city}, {property.state}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Saved {formatDistanceToNow(new Date(savedProperty.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <Badge variant="secondary">
          {property.listingType === "sale"
            ? "For Sale"
            : property.listingType === "rent"
              ? "For Rent"
              : "Student Housing"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="text-lg font-semibold">{priceDisplay}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {property.numBedrooms} bed
            </span>
            <span className="text-muted-foreground">
              {property.numBathrooms} bath
            </span>
            {property.area && (
              <span className="text-muted-foreground">
                {property.area} sq ft
              </span>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {property.propertyType.charAt(0).toUpperCase() +
              property.propertyType.slice(1)}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/properties/${property.id}`}>View Details</Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from Saved?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this property from your saved
                    list? You can always save it again later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnsave}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

