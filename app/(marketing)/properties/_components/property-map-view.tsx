"use client";

import { useMemo, useState, useCallback } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { useQueryState, parseAsString } from "nuqs";
import { Loader2, MapPin } from "lucide-react";

import type { Property } from "@/lib/types/property.type";
import { env } from "@/lib/env";
import { PropertyCard } from "./property-card";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface PropertyMapViewProps {
  properties: Property[];
}

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

const containerStyle: google.maps.MapOptions["mapId"] & {
  width: string;
  height: string;
} = {
  width: "100%",
  height: "100%",
};

export function PropertyMapView({ properties }: PropertyMapViewProps) {
  const [lat] = useQueryState("lat", parseAsString.withDefault(""));
  const [lng] = useQueryState("lng", parseAsString.withDefault(""));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const center = useMemo(() => {
    if (lat && lng) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        return { lat: latNum, lng: lngNum };
      }
    }

    const withLocation = properties.filter(
      (p) =>
        p.location &&
        typeof p.location.latitude === "number" &&
        typeof p.location.longitude === "number",
    );

    if (withLocation.length > 0) {
      const first = withLocation[0].location;
      return {
        lat: first.latitude,
        lng: first.longitude,
      };
    }

    return defaultCenter;
  }, [lat, lng, properties]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  if (loadError) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-xl border bg-destructive/5">
        <p className="text-sm text-destructive">
          Failed to load map. Please check your Google Maps API configuration.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 rounded-xl border bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    );
  }

  const selectedProperty =
    selectedId && properties.find((p) => p.id === selectedId);

  return (
    <div className="relative h-[60vh] w-full overflow-hidden rounded-2xl border bg-card shadow-sm md:h-[70vh]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {properties.map((property) => {
          const loc = property.location;
          if (
            !loc ||
            typeof loc.latitude !== "number" ||
            typeof loc.longitude !== "number"
          ) {
            return null;
          }

          const isActive = selectedId === property.id;

          return (
            <MarkerF
              key={property.id}
              position={{
                lat: loc.latitude,
                lng: loc.longitude,
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: isActive ? 9 : 7,
                fillColor: isActive ? "#0f766e" : "#2563eb",
                fillOpacity: 0.9,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
              onClick={() => handleMarkerClick(property.id)}
            />
          );
        })}

        {selectedProperty && selectedProperty.location && (
          <InfoWindowF
            position={{
              lat: selectedProperty.location.latitude,
              lng: selectedProperty.location.longitude,
            }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="w-[260px] space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-tight">
                    {selectedProperty.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProperty.address}
                  </p>
                </div>
              </div>
              <PropertyCard property={selectedProperty} />
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}


