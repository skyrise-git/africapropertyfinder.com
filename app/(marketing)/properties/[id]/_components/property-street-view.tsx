"use client";

import { useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";

interface PropertyStreetViewProps {
  lat: number;
  lng: number;
}

export function PropertyStreetView({ lat, lng }: PropertyStreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) {
      setError(true);
      return;
    }

    const initStreetView = () => {
      if (!containerRef.current || !window.google?.maps) return;

      const sv = new window.google.maps.StreetViewService();
      sv.getPanorama(
        { location: { lat, lng }, radius: 500 },
        (data: google.maps.StreetViewPanoramaData | null, status: google.maps.StreetViewStatus) => {
          if (status === google.maps.StreetViewStatus.OK && containerRef.current) {
            new window.google.maps.StreetViewPanorama(containerRef.current, {
              position: { lat, lng },
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
              addressControl: false,
              showRoadLabels: true,
              motionTracking: false,
            });
            setLoaded(true);
          } else {
            setError(true);
          }
        }
      );
    };

    if (window.google?.maps) {
      initStreetView();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = initStreetView;
      script.onerror = () => setError(true);
      document.head.appendChild(script);
    }
  }, [lat, lng]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Street View not available for this location</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Loading Street View...</p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full rounded-lg" />
    </div>
  );
}
