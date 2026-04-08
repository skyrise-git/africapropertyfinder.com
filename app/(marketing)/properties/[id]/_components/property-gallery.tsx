"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  BedDouble,
  Bath,
  Maximize2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Property } from "@/lib/types/property.type";
import { PropertyStreetView } from "./property-street-view";

type PropertyImage = NonNullable<Property["images"]>[number];

type PropertyGalleryProps = {
  property: Property;
};

const listingTypeLabel: Record<Property["listingType"], string> = {
  sale: "FOR SALE",
  rent: "FOR RENT",
  "student-housing": "STUDENT HOUSING",
};

export function PropertyGallery({ property }: PropertyGalleryProps) {
  const images: PropertyImage[] = property.images || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"photos" | "streetview">("photos");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (images.length > 0 && currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  const safeImageIndex = Math.max(
    0,
    Math.min(currentImageIndex, images.length - 1)
  );
  const currentImage = images[safeImageIndex];

  const handleOpenGallery = (index?: number) => {
    if (index !== undefined) {
      setCurrentImageIndex(index);
    }
    setIsGalleryOpen(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleGalleryPrevious = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleGalleryNext = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!isGalleryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setCurrentImageIndex((prev) =>
            prev > 0 ? prev - 1 : images.length - 1
          );
          setZoomLevel(1);
          setImagePosition({ x: 0, y: 0 });
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentImageIndex((prev) =>
            prev < images.length - 1 ? prev + 1 : 0
          );
          setZoomLevel(1);
          setImagePosition({ x: 0, y: 0 });
          break;
        case "Escape":
          e.preventDefault();
          handleCloseGallery();
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoomLevel((prev) => Math.min(prev + 0.25, 3));
          break;
        case "-":
          e.preventDefault();
          setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
          break;
        case "0":
          e.preventDefault();
          setZoomLevel(1);
          setImagePosition({ x: 0, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGalleryOpen, images.length]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoomLevel > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - imagePosition.x,
          y: e.clientY - imagePosition.y,
        });
      }
    },
    [zoomLevel, imagePosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && zoomLevel > 1) {
        setImagePosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, zoomLevel, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isGalleryOpen) {
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [currentImageIndex, isGalleryOpen]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isGalleryOpen) return;
      e.preventDefault();

      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(prev + 0.1, 3));
      } else {
        setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
      }
    },
    [isGalleryOpen]
  );

  if (images.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div
          className="relative w-full h-[360px] md:h-[480px] lg:h-[540px] rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={() => handleOpenGallery(0)}
        >
          <img
            src={images[0].url}
            alt={`${property.title} - Main image`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge
              variant="destructive"
              className="bg-destructive/90 backdrop-blur-sm font-semibold uppercase text-xs"
            >
              {listingTypeLabel[property.listingType]}
            </Badge>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="flex items-center gap-2 text-white">
                <BedDouble className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                <div>
                  <div className="text-lg md:text-xl font-bold">
                    {property.numBedrooms}
                  </div>
                  <div className="text-xs md:text-sm text-white/80">
                    Bedrooms
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Bath className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                <div>
                  <div className="text-lg md:text-xl font-bold">
                    {property.numBathrooms}
                  </div>
                  <div className="text-xs md:text-sm text-white/80">
                    Bathrooms
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Maximize2 className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                <div>
                  <div className="text-lg md:text-xl font-bold">
                    {property.area
                      ? `${property.area.toLocaleString("en-US")}`
                      : "—"}
                  </div>
                  <div className="text-xs md:text-sm text-white/80">sq ft</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                <div>
                  <div className="text-lg md:text-xl font-bold">
                    {new Date(property.createdAt).getFullYear()}
                  </div>
                  <div className="text-xs md:text-sm text-white/80">Built</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.slice(1, 5).map((image, index) => {
              const actualIndex = index + 1;
              const remainingCount = images.length - (actualIndex + 1);
              return (
                <button
                  key={image.fileKey || actualIndex}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenGallery(actualIndex);
                  }}
                  className="relative rounded-xl overflow-hidden bg-muted cursor-pointer group aspect-square"
                  aria-label={`View image ${actualIndex + 1}`}
                >
                  <img
                    src={image.url}
                    alt={`${property.title} - Image ${actualIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  {remainingCount > 0 && index === 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-white text-lg font-bold">
                        +{remainingCount} more
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {property.title} - Image Gallery ({safeImageIndex + 1} of{" "}
              {images.length})
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex flex-col">
            {/* Tab bar + close */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
              <div className="flex gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setGalleryTab("photos")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${galleryTab === "photos" ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
                >
                  Photos
                </button>
                <button
                  onClick={() => setGalleryTab("streetview")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${galleryTab === "streetview" ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
                >
                  Street View
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseGallery}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {galleryTab === "streetview" ? (
              <div className="flex-1 pt-14">
                <PropertyStreetView
                  lat={property.location?.latitude ?? 0}
                  lng={property.location?.longitude ?? 0}
                />
              </div>
            ) : (
            <div className="relative w-full h-full flex items-center justify-center pt-14">

            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGalleryPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGalleryNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              {zoomLevel !== 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  className="bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              )}
            </div>

            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-md text-sm font-medium">
                {safeImageIndex + 1} / {images.length}
              </div>
            )}

            {zoomLevel !== 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-md text-sm font-medium">
                {Math.round(zoomLevel * 100)}%
              </div>
            )}

            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {currentImage && (
                <img
                  src={currentImage.url}
                  alt={`${property.title} - Image ${safeImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${
                      imagePosition.x / zoomLevel
                    }px, ${imagePosition.y / zoomLevel}px)`,
                    cursor:
                      zoomLevel > 1
                        ? isDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                  }}
                  draggable={false}
                />
              )}
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 max-w-[90%] overflow-x-auto pb-2 px-4">
                {images.map((image, index) => (
                  <button
                    key={image.fileKey || index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setZoomLevel(1);
                      setImagePosition({ x: 0, y: 0 });
                    }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === safeImageIndex
                        ? "border-white ring-2 ring-white/50"
                        : "border-white/30 hover:border-white/60"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
