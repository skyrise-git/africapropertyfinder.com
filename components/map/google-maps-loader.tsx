"use client";

import Script from "next/script";
import { env } from "@/lib/env";

interface GoogleMapsLoaderProps {
  onLoad?: () => void;
}

export function GoogleMapsLoader({ onLoad }: GoogleMapsLoaderProps) {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`}
      strategy="lazyOnload"
      onLoad={() => {
        if (onLoad) {
          onLoad();
        }
      }}
      onError={(e) => {
        console.error("Failed to load Google Maps script:", e);
      }}
    />
  );
}

