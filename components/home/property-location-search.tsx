"use client";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { MapPin, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface LocationData {
  lat: string;
  lng: string;
  label: string;
}

interface PropertyLocationSearchProps {
  onLocationSelect?: (location: LocationData | null) => void;
  placeholder?: string;
  className?: string;
}

function PropertyLocationSearchInner({
  onLocationSelect,
  placeholder = "Search area or city…",
  className,
}: PropertyLocationSearchProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
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

        const locationData: LocationData = {
          lat: String(latNum),
          lng: String(lngNum),
          label: description,
        };

        setSelectedLocation(locationData);
        setValue(description, false);
        onLocationSelect?.(locationData);
      } catch (error) {
        console.error("Error selecting place:", error);
        setValue("", false);
      } finally {
        setIsGeocoding(false);
      }
    },
    [clearSuggestions, setValue, onLocationSelect],
  );

  const handleClear = useCallback(() => {
    setValue("", false);
    setSelectedLocation(null);
    clearSuggestions();
    onLocationSelect?.(null);
  }, [setValue, clearSuggestions, onLocationSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);

    // Clear location if user starts typing something different
    if (selectedLocation && inputValue !== selectedLocation.label) {
      setSelectedLocation(null);
      onLocationSelect?.(null);
    }
  };

  const displayValue = selectedLocation?.label || value || "";
  const showSuggestions = status === "OK" && data.length > 0 && !isGeocoding && !selectedLocation;
  const isLoading = !ready || isGeocoding;
  const hasValue = Boolean(displayValue);

  return (
    <div ref={containerRef} className={`relative w-full ${className || ""}`}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
        <Input
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            // Show suggestions again if there's a value and no location selected
            if (value && data.length === 0 && !selectedLocation) {
              setValue(value, true);
            }
          }}
          placeholder={placeholder}
          className={`h-9 pl-10 text-sm w-full bg-white/50 backdrop-blur-sm border-white/30 text-gray-700 dark:text-gray-300 placeholder:text-gray-500 ${
            hasValue && !isLoading ? "pr-10" : isLoading ? "pr-10" : "pr-3"
          }`}
          disabled={isLoading}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400 z-10" />
        )}
        {hasValue && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-white/20 rounded-full z-10"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
            <span className="sr-only">Clear location</span>
          </Button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-lg border border-white/30 bg-white/95 backdrop-blur-lg shadow-xl">
          {data.map(({ place_id, description }) => (
            <button
              key={place_id}
              type="button"
              onClick={() => handleSelect(place_id, description)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-white/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
              disabled={isGeocoding}
            >
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {status === "ZERO_RESULTS" && value && !isGeocoding && !selectedLocation && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-white/30 bg-white/95 backdrop-blur-lg p-4 text-sm text-gray-500 shadow-xl">
          No locations found. Try a different search term.
        </div>
      )}
    </div>
  );
}

export function PropertyLocationSearch(props: PropertyLocationSearchProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) {
    return (
      <div className={`relative ${props.className || ""}`}>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Map search unavailable"
            className="h-9 pl-10 pr-3 text-sm bg-white/50 backdrop-blur-sm border-white/30 text-gray-700 dark:text-gray-300"
            disabled
          />
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`relative ${props.className || ""}`}>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Loading map search..."
            className="h-9 pl-10 pr-10 text-sm bg-white/50 backdrop-blur-sm border-white/30 text-gray-700 dark:text-gray-300"
            disabled
          />
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return <PropertyLocationSearchInner {...props} />;
}
