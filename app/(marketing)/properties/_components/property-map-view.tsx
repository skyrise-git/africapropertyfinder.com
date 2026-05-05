"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  OverlayViewF,
  OverlayView,
  InfoWindowF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useQueryState, parseAsString } from "nuqs";
import { Loader2, MapPin } from "lucide-react";

import type { Property } from "@/lib/types/property.type";
import { env } from "@/lib/env";
import { PropertyCard } from "./property-card";
import { formatCompactMoney, resolveCountryCode } from "@/lib/utils/country";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface PropertyMapViewProps {
  properties: Property[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  onPropertySelect?: (id: string | null) => void;
}

const defaultCenter = { lat: -29.0, lng: 25.0 };

const containerStyle = { width: "100%", height: "100%" };

function formatShortPrice(
  n: number | undefined | null,
  country?: string
): string {
  return formatCompactMoney(n ?? null, resolveCountryCode(country));
}

function PriceMarker({
  property,
  isActive,
  onClick,
}: {
  property: Property;
  isActive: boolean;
  onClick: () => void;
}) {
  const price =
    property.listingType === "sale" ? property.price : property.rent;
  const label = formatShortPrice(price, property.country);
  const suffix = property.listingType !== "sale" ? "/mo" : "";

  const bg = isActive
    ? "bg-primary text-white shadow-lg scale-110"
    : "bg-white text-slate-800 shadow-md hover:shadow-lg hover:scale-105 border border-gray-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
        transition-all duration-200 cursor-pointer select-none
        ${bg}
      `}
      style={{ transform: "translate(-50%, -100%)" }}
    >
      {label}
      {suffix && <span className="font-normal opacity-70">{suffix}</span>}
    </button>
  );
}

export function PropertyMapView({
  properties,
  selectedId: externalSelectedId,
  onMarkerClick,
  onPropertySelect,
}: PropertyMapViewProps) {
  const [lat] = useQueryState("lat", parseAsString.withDefault(""));
  const [lng] = useQueryState("lng", parseAsString.withDefault(""));
  const [selectedCity] = useQueryState("city", parseAsString.withDefault(""));
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundaryRef = useRef<google.maps.Polygon | null>(null);

  const selectedId =
    externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;

  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const property = properties.find((p) => p.id === selectedId);
    if (
      property?.location &&
      typeof property.location.latitude === "number" &&
      typeof property.location.longitude === "number"
    ) {
      mapRef.current.panTo({
        lat: property.location.latitude,
        lng: property.location.longitude,
      });
    }
  }, [selectedId, properties]);

  useEffect(() => {
    if (boundaryRef.current) {
      boundaryRef.current.setMap(null);
      boundaryRef.current = null;
    }

    if (!mapRef.current || !selectedCity || !properties.length) return;

    const cityProps = properties.filter(
      (p) =>
        p.city === selectedCity &&
        p.location &&
        typeof p.location.latitude === "number" &&
        typeof p.location.longitude === "number",
    );

    if (cityProps.length < 2) return;

    const lats = cityProps.map((p) => p.location.latitude);
    const lngs = cityProps.map((p) => p.location.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padLat = (maxLat - minLat) * 0.15 || 0.01;
    const padLng = (maxLng - minLng) * 0.15 || 0.01;

    const bounds = [
      { lat: minLat - padLat, lng: minLng - padLng },
      { lat: minLat - padLat, lng: maxLng + padLng },
      { lat: maxLat + padLat, lng: maxLng + padLng },
      { lat: maxLat + padLat, lng: minLng - padLng },
    ];

    const poly = new google.maps.Polygon({
      paths: bounds,
      strokeColor: "#7c3aed",
      strokeOpacity: 0.6,
      strokeWeight: 2,
      fillColor: "#7c3aed",
      fillOpacity: 0.06,
    });

    poly.setMap(mapRef.current);
    boundaryRef.current = poly;

    const mapBounds = new google.maps.LatLngBounds();
    bounds.forEach((b) => mapBounds.extend(b));
    mapRef.current.fitBounds(mapBounds, 40);
  }, [selectedCity, properties]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
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
      const avgLat =
        withLocation.reduce((s, p) => s + p.location.latitude, 0) /
        withLocation.length;
      const avgLng =
        withLocation.reduce((s, p) => s + p.location.longitude, 0) /
        withLocation.length;
      return { lat: avgLat, lng: avgLng };
    }

    return defaultCenter;
  }, [lat, lng, properties]);

  const handleMarkerClick = useCallback(
    (id: string) => {
      if (onMarkerClick) onMarkerClick(id);
      if (onPropertySelect) onPropertySelect(id);
      if (externalSelectedId === undefined) setInternalSelectedId(id);
    },
    [onMarkerClick, onPropertySelect, externalSelectedId],
  );

  const handleInfoWindowClose = useCallback(() => {
    if (onPropertySelect) onPropertySelect(null);
    if (externalSelectedId === undefined) setInternalSelectedId(null);
  }, [onPropertySelect, externalSelectedId]);

  const visibleProperties = useMemo(() => {
    if (!mapBounds) return properties.slice(0, 400);
    return properties
      .filter((property) => {
        const loc = property.location;
        if (!loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number") {
          return false;
        }
        return mapBounds.contains({ lat: loc.latitude, lng: loc.longitude });
      })
      .slice(0, 400);
  }, [properties, mapBounds]);

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
        zoom={11}
        onLoad={(map) => {
          mapRef.current = map;
          if (properties.length > 1) {
            const bounds = new google.maps.LatLngBounds();
            properties.forEach((p) => {
              if (
                p.location &&
                typeof p.location.latitude === "number" &&
                typeof p.location.longitude === "number"
              ) {
                bounds.extend({
                  lat: p.location.latitude,
                  lng: p.location.longitude,
                });
              }
            });
            map.fitBounds(bounds, 60);
          }
        }}
        onIdle={() => {
          const bounds = mapRef.current?.getBounds();
          if (bounds) setMapBounds(bounds);
        }}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {visibleProperties.map((property) => {
          const loc = property.location;
          if (
            !loc ||
            typeof loc.latitude !== "number" ||
            typeof loc.longitude !== "number"
          )
            return null;

          const isActive = selectedId === property.id;

          return (
            <OverlayViewF
              key={property.id}
              position={{ lat: loc.latitude, lng: loc.longitude }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <PriceMarker
                property={property}
                isActive={isActive}
                onClick={() => handleMarkerClick(property.id)}
              />
            </OverlayViewF>
          );
        })}

        {selectedProperty && selectedProperty.location && (
          <InfoWindowF
            position={{
              lat: selectedProperty.location.latitude,
              lng: selectedProperty.location.longitude,
            }}
            onCloseClick={handleInfoWindowClose}
            options={{ pixelOffset: new google.maps.Size(0, -30) }}
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

      {selectedCity && (
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border text-xs font-medium text-primary">
          Showing: {selectedCity}
        </div>
      )}
    </div>
  );
}
