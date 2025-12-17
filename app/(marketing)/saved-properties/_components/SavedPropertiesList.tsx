"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Heart } from "lucide-react";
import { SavedPropertyCard } from "./SavedPropertyCard";
import type { Property } from "@/lib/types/property.type";
import type { SavedProperty } from "@/lib/types/saved-property.type";

type SavedPropertiesListProps = {
  savedProperties: SavedProperty[];
  properties: Property[];
  loading: boolean;
  errorMessage?: string | null;
  userId: string;
  onUnsave: () => void;
};

export function SavedPropertiesList({
  savedProperties,
  properties,
  loading,
  errorMessage,
  userId,
  onUnsave,
}: SavedPropertiesListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (savedProperties.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">No saved properties yet</p>
            <p className="text-sm text-muted-foreground">
              Start exploring properties and save your favorites to view them
              later.
            </p>
          </div>
          <Button asChild>
            <Link href="/properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Browse properties
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Create a map of propertyId -> Property for quick lookup
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  // Filter saved properties to only include those with valid properties
  const validSavedProperties = savedProperties.filter((sp) =>
    propertyMap.has(sp.propertyId)
  );

  if (validSavedProperties.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">No saved properties found</p>
            <p className="text-sm text-muted-foreground">
              Some saved properties may have been removed or are no longer
              available.
            </p>
          </div>
          <Button asChild>
            <Link href="/properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Browse properties
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {validSavedProperties.map((savedProperty) => {
        const property = propertyMap.get(savedProperty.propertyId);
        if (!property) return null;

        return (
          <SavedPropertyCard
            key={savedProperty.id}
            savedProperty={savedProperty}
            property={property}
            userId={userId}
            onUnsave={onUnsave}
          />
        );
      })}
    </div>
  );
}

