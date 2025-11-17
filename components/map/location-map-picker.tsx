"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import type { Location } from "@/lib/types/property.type";

// Fix default marker icons for Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface LocationMapPickerProps {
  value?: Location | null;
  onChange: (location: Location) => void;
  error?: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export function LocationMapPicker({
  value,
  onChange,
  error,
}: LocationMapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    value || null,
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current).setView(
      value
        ? [value.latitude, value.longitude]
        : [28.6139, 77.209], // Default to a central location
      13,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add click handler for map
    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      await handleLocationSelect(lat, lng);
    });

    // If we have an initial value, set marker
    if (value) {
      setMarker(value.latitude, value.longitude);
    }

    return () => {
      map.remove();
    };
  }, []);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      setMarker(selectedLocation.latitude, selectedLocation.longitude);
      mapRef.current.setView(
        [selectedLocation.latitude, selectedLocation.longitude],
        15,
      );
    }
  }, [selectedLocation]);

  const setMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    }).addTo(mapRef.current);

    markerRef.current = marker;
  };

  const geocodeAddress = async (address: string): Promise<NominatimResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "SkyRise Real Estate Property Listing",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await response.json();
      return data as NominatimResult[];
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  };

  const reverseGeocode = async (
    lat: number,
    lng: number,
  ): Promise<NominatimResult | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "SkyRise Real Estate Property Listing",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = await response.json();
      return data as NominatimResult;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await geocodeAddress(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    const result = await reverseGeocode(lat, lng);
    if (!result) return;

    const address = result.address || {};
    const location: Location = {
      latitude: lat,
      longitude: lng,
      address:
        result.display_name ||
        `${address.house_number || ""} ${address.road || ""}`.trim() ||
        "Unknown address",
      city: address.city || address.town || "",
      state: address.state || "",
      zipCode: address.postcode || "",
    };

    setSelectedLocation(location);
    onChange(location);
    setSearchQuery(location.address);
    setSearchResults([]);
  };

  const handleResultClick = async (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    await handleLocationSelect(lat, lng);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for an address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResults([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-background shadow-lg">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleResultClick(result)}
                className="w-full px-4 py-2 text-left hover:bg-muted"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="space-y-2">
        <div
          ref={containerRef}
          className="w-full h-[400px] rounded-lg border"
          style={{ zIndex: 0 }}
        />
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

