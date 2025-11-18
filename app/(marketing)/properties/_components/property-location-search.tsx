"use client";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useQueryState, parseAsString } from "nuqs";
import { MapPin, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

function PropertyLocationSearchInner() {
  const [lat, setLat] = useQueryState("lat", parseAsString.withDefault(""));
  const [lng, setLng] = useQueryState("lng", parseAsString.withDefault(""));
  const [locationLabel, setLocationLabel] = useQueryState(
    "loc",
    parseAsString.withDefault(""),
  );

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

  const isLoading = !ready;

  const handleSelect = useCallback(
    async (placeId: string, description: string) => {
      clearSuggestions();
      try {
        const results = await getGeocode({ placeId });
        const { lat: latNum, lng: lngNum } = await getLatLng(results[0]);

        setLat(String(latNum));
        setLng(String(lngNum));
        setLocationLabel(description || null);
        setValue(description, false);
      } catch (error) {
        console.error("Error selecting place:", error);
      }
    },
    [clearSuggestions, setLat, setLng, setLocationLabel, setValue],
  );

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value || locationLabel}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search area or city on map..."
          className="h-9 pl-9 pr-8 text-sm"
          disabled={isLoading}
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {status === "OK" && data.length > 0 && (
        <div className="absolute z-40 mt-2 w-full max-h-64 overflow-y-auto rounded-md border bg-background shadow-lg">
          {data.map(({ place_id, description }) => (
            <button
              key={place_id}
              type="button"
              onClick={() => handleSelect(place_id, description)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                <span>{description}</span>
              </div>
            </button>
          ))}
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


