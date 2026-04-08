"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import type { Location } from "@/lib/types/property.type";
import { env } from "@/lib/env";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface LocationMapPickerProps {
  value?: Location | null;
  onChange: (location: Location) => void;
  error?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

// Inner component that uses usePlacesAutocomplete hook
function LocationMapPickerInner({
  value,
  onChange,
  error,
}: LocationMapPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    value || null,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const {
    ready,
    value: autocompleteValue,
    setValue: setAutocompleteValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

  // Initialize with value if provided
  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
      setAutocompleteValue(value.address);
    }
  }, [value, setAutocompleteValue]);

  // Update map center when location changes
  useEffect(() => {
    if (map && selectedLocation) {
      map.setCenter({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
      });
      map.setZoom(15);
    }
  }, [map, selectedLocation]);

  const extractAddressComponents = (
    addressComponents: google.maps.GeocoderAddressComponent[],
  ) => {
    const components: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    } = {};

    addressComponents.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) {
        components.street = component.long_name;
      } else if (types.includes("route")) {
        components.street = components.street
          ? `${components.street} ${component.long_name}`
          : component.long_name;
      } else if (
        types.includes("locality") ||
        types.includes("administrative_area_level_2")
      ) {
        components.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        components.state = component.short_name;
      } else if (types.includes("postal_code")) {
        components.zipCode = component.long_name;
      }
    });

    return components;
  };

  const handleSelect = useCallback(
    async (placeId: string, description: string) => {
      setIsGeocoding(true);
      clearSuggestions();

      try {
        const results = await getGeocode({ placeId });
        const { lat, lng } = await getLatLng(results[0]);

        const addressComponents = results[0].address_components || [];
        const components = extractAddressComponents(addressComponents);

        const location: Location = {
          latitude: lat,
          longitude: lng,
          address: description,
          city: components.city || "",
          state: components.state || "",
          zipCode: components.zipCode || "",
        };

        setSelectedLocation(location);
        onChange(location);
        setAutocompleteValue(description, false);
      } catch (error) {
        console.error("Error selecting place:", error);
      } finally {
        setIsGeocoding(false);
      }
    },
    [clearSuggestions, onChange, setAutocompleteValue],
  );

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      setIsGeocoding(true);
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      try {
        const geocoder = new google.maps.Geocoder();
        const results = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode(
              { location: { lat, lng } },
              (results, status) => {
                if (status === "OK" && results) {
                  resolve(results);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              },
            );
          },
        );

        if (results && results[0]) {
          const result = results[0];
          const addressComponents = result.address_components || [];
          const components = extractAddressComponents(addressComponents);

          const location: Location = {
            latitude: lat,
            longitude: lng,
            address: result.formatted_address || "",
            city: components.city || "",
            state: components.state || "",
            zipCode: components.zipCode || "",
          };

          setSelectedLocation(location);
          onChange(location);
          setAutocompleteValue(result.formatted_address || "", false);
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      } finally {
        setIsGeocoding(false);
      }
    },
    [onChange, setAutocompleteValue],
  );

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoaded(true);

    // Set initial center if we have a value
    if (selectedLocation) {
      mapInstance.setCenter({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
      });
      mapInstance.setZoom(15);
    }
  }, [selectedLocation]);

  return (
    <div className="space-y-4">
      {/* Autocomplete Input */}
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search for an address..."
            value={autocompleteValue}
            onChange={(e) => setAutocompleteValue(e.target.value)}
            disabled={!ready || isGeocoding}
            className="pl-9"
          />
        </div>

        {/* Suggestions Dropdown */}
        {status === "OK" && data.length > 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
            {data.map(({ place_id, description }) => (
              <button
                key={place_id}
                type="button"
                onClick={() => handleSelect(place_id, description)}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                disabled={isGeocoding}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{description}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {isGeocoding && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Map */}
      <div className="space-y-2">
        <div className="rounded-lg border overflow-hidden">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={
              selectedLocation
                ? {
                    lat: selectedLocation.latitude,
                    lng: selectedLocation.longitude,
                  }
                : defaultCenter
            }
            zoom={selectedLocation ? 15 : 13}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {selectedLocation && (
              <Marker
                position={{
                  lat: selectedLocation.latitude,
                  lng: selectedLocation.longitude,
                }}
              />
            )}
          </GoogleMap>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {selectedLocation && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            <p className="font-medium">Selected Location:</p>
            <p>{selectedLocation.address}</p>
            <p className="text-muted-foreground">
              {selectedLocation.city}
              {selectedLocation.state && `, ${selectedLocation.state}`}
              {selectedLocation.zipCode && ` ${selectedLocation.zipCode}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Outer wrapper component that handles API loading
export function LocationMapPicker({
  value,
  onChange,
  error,
}: LocationMapPickerProps) {
  const { isLoaded: isApiLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load Google Maps. Please check your API key configuration.
          </p>
        </div>
      </div>
    );
  }

  if (!isApiLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-[400px] rounded-lg border">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return <LocationMapPickerInner value={value} onChange={onChange} error={error} />;
}
