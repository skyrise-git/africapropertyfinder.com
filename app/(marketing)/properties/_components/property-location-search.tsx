"use client";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useQueryState, parseAsString } from "nuqs";
import { MapPin, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

function PropertyLocationSearchInner() {
  const [lat, setLat] = useQueryState("lat", parseAsString.withDefault(""));
  const [lng, setLng] = useQueryState("lng", parseAsString.withDefault(""));
  const [locationLabel, setLocationLabel] = useQueryState(
    "loc",
    parseAsString.withDefault(""),
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: {
      types: ["geocode"],
    },
  });

  // Sync input value with locationLabel when it changes externally
  useEffect(() => {
    if (locationLabel && !value) {
      setValue(locationLabel, false);
    }
  }, [locationLabel, value, setValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        clearSuggestions();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clearSuggestions]);

  const handleSelect = useCallback(
    async (placeId: string, description: string) => {
      clearSuggestions();
      setIsGeocoding(true);
      try {
        const results = await getGeocode({ placeId });
        const { lat: latNum, lng: lngNum } = await getLatLng(results[0]);

        setLat(String(latNum));
        setLng(String(lngNum));
        setLocationLabel(description || null);
        setValue(description, false);
      } catch (error) {
        console.error("Error selecting place:", error);
        setValue("", false);
      } finally {
        setIsGeocoding(false);
      }
    },
    [clearSuggestions, setLat, setLng, setLocationLabel, setValue],
  );

  const handleClear = useCallback(() => {
    setValue("", false);
    setLat(null);
    setLng(null);
    setLocationLabel(null);
    clearSuggestions();
  }, [setValue, setLat, setLng, setLocationLabel, clearSuggestions]);

  const hasValue = Boolean(value || locationLabel);
  const showSuggestions = status === "OK" && data.length > 0 && !isGeocoding;
  const isLoading = !ready || isGeocoding;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
        <Input
          value={value || locationLabel || ""}
          onChange={(e) => {
            setValue(e.target.value);
            // Clear location if user starts typing
            if (locationLabel && e.target.value !== locationLabel) {
              setLat(null);
              setLng(null);
              setLocationLabel(null);
            }
          }}
          onFocus={() => {
            // Show suggestions again if there's a value
            if (value && data.length === 0) {
              setValue(value, true);
            }
          }}
          placeholder="Search area or city…"
          className={`h-9 pl-9 text-sm w-full ${
            hasValue && !isLoading ? "pr-8" : isLoading ? "pr-8" : "pr-3"
          }`}
          disabled={isLoading}
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground z-10" />
        )}
        {hasValue && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-muted rounded-full z-10"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Clear location</span>
          </Button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          {data.map(({ place_id, description }) => (
            <button
              key={place_id}
              type="button"
              onClick={() => handleSelect(place_id, description)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
              disabled={isGeocoding}
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm">{description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {status === "ZERO_RESULTS" && value && !isGeocoding && (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-border bg-background p-3 text-sm text-muted-foreground shadow-lg">
          No locations found. Try a different search term.
        </div>
      )}
    </div>
  );
}

export function PropertyLocationSearch() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) {
    return (
      <div className="relative">
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Map search unavailable"
            className="h-9 pl-9 pr-3 text-sm"
            disabled
          />
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative">
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Loading map search..."
            className="h-9 pl-9 pr-8 text-sm"
            disabled
          />
          <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return <PropertyLocationSearchInner />;
}


