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

const containerStyle: {
  width: string;
  height: string;
} = {
  width: "100%",
  height: "100%",
};

// Create custom SVG marker icon
function createCustomMarkerIcon(
  property: Property,
  isActive: boolean = false
): google.maps.Icon {
  const size = isActive ? 48 : 40;
  const iconSize = isActive ? 24 : 20;
  const strokeWidth = isActive ? 3 : 2;
  
  // Color based on listing type
  const getColors = () => {
    switch (property.listingType) {
      case "sale":
        return {
          fill: "#22c55e", // green
          stroke: "#ffffff",
          shadow: "rgba(34, 197, 94, 0.4)",
        };
      case "rent":
        return {
          fill: "#3b82f6", // blue
          stroke: "#ffffff",
          shadow: "rgba(59, 130, 246, 0.4)",
        };
      case "student-housing":
        return {
          fill: "#a855f7", // purple
          stroke: "#ffffff",
          shadow: "rgba(168, 85, 247, 0.4)",
        };
      default:
        return {
          fill: "#64748b", // gray
          stroke: "#ffffff",
          shadow: "rgba(100, 116, 139, 0.4)",
        };
    }
  };

  const colors = getColors();
  
  // Icon paths based on property type (24x24 viewBox)
  const getIconPaths = () => {
    switch (property.propertyType) {
      case "house":
        // House icon with roof
        return `
          <path d="M3 12L12 3L21 12V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V12Z" fill="${colors.stroke}" stroke="${colors.stroke}" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M9 21V15H15V21" stroke="${colors.fill}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        `;
      case "apartment":
      case "condo":
        // Building/apartment icon
        return `
          <path d="M4 21V9L12 3L20 9V21" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M9 21V13H15V21" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M4 13H20" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M4 17H20" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        `;
      case "townhouse":
        // Townhouse icon (multiple units)
        return `
          <path d="M3 21V9L12 3L21 9V21" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M9 21V13H15V21" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M3 13H9" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M15 13H21" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M3 17H9" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M15 17H21" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        `;
      case "studio":
        // Small building icon
        return `
          <rect x="6" y="10" width="12" height="11" rx="1" stroke="${colors.stroke}" stroke-width="1.5" fill="none"/>
          <path d="M12 10V6L9 4L6 6V10" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M9 14H15" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M9 18H15" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        `;
      case "room":
        // Room icon
        return `
          <rect x="4" y="6" width="16" height="15" rx="1" stroke="${colors.stroke}" stroke-width="1.5" fill="none"/>
          <path d="M4 10H20" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M8 14H16" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M8 18H16" stroke="${colors.stroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        `;
      default:
        // Default location pin icon
        return `
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${colors.stroke}" stroke="${colors.stroke}" stroke-width="1.5"/>
          <circle cx="12" cy="9" r="2.5" fill="${colors.fill}"/>
        `;
    }
  };

  const iconPaths = getIconPaths();

  // Create complete SVG string with marker pin shape
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${property.id}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Pin background circle -->
      <circle 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${size / 2 - strokeWidth}" 
        fill="${colors.fill}" 
        stroke="${colors.stroke}" 
        stroke-width="${strokeWidth}"
        filter="url(#shadow-${property.id})"
      />
      <!-- Property type icon -->
      <g transform="translate(${(size - iconSize) / 2}, ${(size - iconSize) / 2}) scale(${iconSize / 24})">
        ${iconPaths}
      </g>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size),
  };
}

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
              icon={createCustomMarkerIcon(property, isActive)}
              onClick={() => handleMarkerClick(property.id)}
              animation={isActive ? google.maps.Animation.BOUNCE : undefined}
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


