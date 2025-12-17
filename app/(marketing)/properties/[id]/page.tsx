"use client";

import { useParams } from "next/navigation";
import { useFirebaseRealtime } from "@/hooks/use-firebase-realtime";
import type { Property } from "@/lib/types/property.type";
import { formatCurrency } from "@ashirbad/js-core";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Maximize2,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Car,
  Wifi,
  PawPrint,
  Waves,
  Dumbbell,
  Building2,
  Shield,
  TreePine,
  UtensilsCrossed,
  Flame,
  Users,
  Ban,
  UserCheck,
  Clock,
  Video,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { PropertyMapView } from "../_components/property-map-view";

const listingTypeLabel: Record<Property["listingType"], string> = {
  sale: "FOR SALE",
  rent: "FOR RENT",
  "student-housing": "STUDENT HOUSING",
};

function formatPrice(property: Property) {
  if (property.listingType === "sale" && property.price != null) {
    try {
      return formatCurrency(property.price, "USD");
    } catch {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property.price);
    }
  }

  if (
    (property.listingType === "rent" ||
      property.listingType === "student-housing") &&
    property.rent != null
  ) {
    try {
      const formatted = formatCurrency(property.rent, "USD");
      return `${formatted}${
        property.paymentFrequency
          ? ` / ${property.paymentFrequency}`
          : " / monthly"
      }`;
    } catch {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property.rent);
      return `${formatted}${
        property.paymentFrequency
          ? ` / ${property.paymentFrequency}`
          : " / monthly"
      }`;
    }
  }

  return "Price on request";
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { data, loading, error } = useFirebaseRealtime<Property>(
    `properties/${id}`,
    { asArray: false }
  );

  const property = data ? ({ ...data, id } as Property) : null;

  const images = property?.images || [];

  // Reset image index when images change or if index is out of bounds
  useEffect(() => {
    if (images.length > 0 && currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  // Ensure currentImageIndex is within bounds
  const safeImageIndex = Math.max(
    0,
    Math.min(currentImageIndex, images.length - 1)
  );
  const currentImage = images[safeImageIndex];

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

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

  // Keyboard navigation
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

  // Mouse drag for panning when zoomed
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

  // Reset zoom when image changes
  useEffect(() => {
    if (isGalleryOpen) {
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [currentImageIndex, isGalleryOpen]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isGalleryOpen) return;
      e.preventDefault();

      if (e.deltaY < 0) {
        // Zoom in
        setZoomLevel((prev) => Math.min(prev + 0.1, 3));
      } else {
        // Zoom out
        setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
      }
    },
    [isGalleryOpen]
  );

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error?.message || "Property not found"}
            </p>
            <Link href="/properties">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const amenities = [
    { key: "parkingAvailable", label: "Parking", icon: Car },
    { key: "wifi", label: "Wi-Fi", icon: Wifi },
    { key: "petsAllowed", label: "Pets Allowed", icon: PawPrint },
    { key: "pool", label: "Pool", icon: Waves },
    { key: "gym", label: "Gym", icon: Dumbbell },
    { key: "elevator", label: "Elevator", icon: Building2 },
    { key: "security", label: "Security", icon: Shield },
    { key: "garden", label: "Garden", icon: TreePine },
    { key: "dishwasher", label: "Dishwasher", icon: UtensilsCrossed },
    { key: "fireplace", label: "Fireplace", icon: Flame },
    { key: "laundry", label: "Laundry", icon: UtensilsCrossed },
    { key: "heatingCooling", label: "Heating & Cooling", icon: Flame },
    { key: "balcony", label: "Balcony", icon: Home },
  ].filter((amenity) => property[amenity.key as keyof Property]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6"
    >
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="group">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Properties
          </Button>
        </Link>
      </motion.div>

      {/* Image Gallery */}
      {images.length > 0 && currentImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={() => handleOpenGallery()}
        >
          <img
            src={currentImage.url}
            alt={`${property.title} - Image ${safeImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium">
              Click to view gallery
            </div>
          </div>

          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={handlePreviousImage}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === safeImageIndex
                        ? "w-8 bg-white"
                        : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-md text-sm">
                {safeImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge
              variant="destructive"
              className="bg-destructive/90 backdrop-blur-sm font-semibold uppercase"
            >
              {listingTypeLabel[property.listingType]}
            </Badge>
            <Badge className="bg-white/90 backdrop-blur-sm text-foreground font-semibold">
              {property.propertyType.charAt(0).toUpperCase() +
                property.propertyType.slice(1)}
            </Badge>
          </div>

          {/* Price Overlay */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
            <span className="text-2xl font-bold">{formatPrice(property)}</span>
          </div>
        </motion.div>
      )}

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        >
          {images.map((image, index) => (
            <button
              key={image.fileKey || index}
              onClick={() => handleOpenGallery(index)}
              className={`relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                index === safeImageIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/50 hover:border-primary/50"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image.url}
                alt={`${property.title} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === safeImageIndex && (
                <div className="absolute inset-0 bg-primary/10" />
              )}
            </button>
          ))}
        </motion.div>
      )}

      {/* Gallery Lightbox Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0"
          showCloseButton={true}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {property.title} - Image Gallery ({safeImageIndex + 1} of{" "}
              {images.length})
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseGallery}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Previous Button */}
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

            {/* Next Button */}
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

            {/* Zoom Controls */}
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

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-md text-sm font-medium">
                {safeImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Zoom Level Indicator */}
            {zoomLevel !== 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-md text-sm font-medium">
                {Math.round(zoomLevel * 100)}%
              </div>
            )}

            {/* Main Image */}
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
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
            </div>

            {/* Thumbnail Strip */}
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
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  {property.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {property.address}, {property.city}, {property.state}{" "}
                    {property.zipCode}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                    <BedDouble className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">
                        {property.numBedrooms}
                      </div>
                      <div className="text-sm text-muted-foreground">Beds</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                    <Bath className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">
                        {property.numBathrooms}
                      </div>
                      <div className="text-sm text-muted-foreground">Baths</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                    <Maximize2 className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">
                        {property.area
                          ? `${property.area.toLocaleString("en-US")} sq ft`
                          : "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">Area</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Property Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Property Type
                    </div>
                    <div className="font-semibold capitalize">
                      {property.propertyType.replace("-", " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Furnishing
                    </div>
                    <div className="font-semibold capitalize">
                      {property.furnishing.replace("-", " ")}
                    </div>
                  </div>
                  {property.floorNumber && (
                    <div>
                      <div className="text-sm text-muted-foreground">Floor</div>
                      <div className="font-semibold">
                        {property.floorNumber}
                        {property.totalFloors && ` of ${property.totalFloors}`}
                      </div>
                    </div>
                  )}
                  {property.availableFrom && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Available From
                      </div>
                      <div className="font-semibold">
                        {new Date(property.availableFrom).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {property.isShared && property.sharingDetails && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Shared Property</span>
                      </div>
                      {property.sharingDetails.sharingType && (
                        <div className="text-sm text-muted-foreground ml-6">
                          Sharing Type:{" "}
                          <span className="capitalize">
                            {property.sharingDetails.sharingType}
                          </span>
                        </div>
                      )}
                      {property.sharingDetails.currentOccupants !==
                        undefined && (
                        <div className="text-sm text-muted-foreground ml-6">
                          Current Occupants:{" "}
                          {property.sharingDetails.currentOccupants}
                        </div>
                      )}
                      {property.sharingDetails.preferredTenantType && (
                        <div className="text-sm text-muted-foreground ml-6">
                          Preferred:{" "}
                          <span className="capitalize">
                            {property.sharingDetails.preferredTenantType}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  {formatPrice(property)}
                </div>
                {property.securityDeposit && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Security Deposit
                    </div>
                    <div className="font-semibold">
                      {(() => {
                        try {
                          return formatCurrency(
                            property.securityDeposit,
                            "USD"
                          );
                        } catch {
                          return new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(property.securityDeposit);
                        }
                      })()}
                    </div>
                  </div>
                )}
                {property.leaseLength && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Lease Length
                    </div>
                    <div className="font-semibold">
                      {property.leaseLength} months
                    </div>
                  </div>
                )}
                {property.utilitiesIncluded !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Utilities
                    </div>
                    <div className="font-semibold">
                      {property.utilitiesIncluded ? "Included" : "Not Included"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map((amenity) => {
                      const Icon = amenity.icon;
                      return (
                        <div
                          key={amenity.key}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                        >
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {amenity.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {property.otherAmenities && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Other Amenities
                        </div>
                        <p className="text-sm">{property.otherAmenities}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Policies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {property.smokingAllowed !== undefined && (
                    <div className="flex items-center gap-2">
                      {property.smokingAllowed ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        Smoking:{" "}
                        {property.smokingAllowed ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                  )}
                  {property.petsAllowed !== undefined && (
                    <div className="flex items-center gap-2">
                      {property.petsAllowed ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        Pets: {property.petsAllowed ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                  )}
                  {property.guestsAllowed !== undefined && (
                    <div className="flex items-center gap-2">
                      {property.guestsAllowed ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        Guests:{" "}
                        {property.guestsAllowed ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                  )}
                  {property.sublettingAllowed !== undefined && (
                    <div className="flex items-center gap-2">
                      {property.sublettingAllowed ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        Subletting:{" "}
                        {property.sublettingAllowed ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                  )}
                  {property.partiesAllowed !== undefined && (
                    <div className="flex items-center gap-2">
                      {property.partiesAllowed ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        Parties:{" "}
                        {property.partiesAllowed ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                  )}
                  {property.quietHours !== undefined && (
                    <div className="flex items-center gap-2">
                      {property.quietHours ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : null}
                      <span className="text-sm">
                        Quiet Hours: {property.quietHours ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Location Map */}
          {property.location && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Address
                      </div>
                      <div className="font-semibold">
                        {property.address}, {property.city}, {property.state}{" "}
                        {property.zipCode}
                      </div>
                    </div>
                    {property.nearbyTransit && (
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Nearby Transit
                        </div>
                        <div className="font-semibold">
                          {property.nearbyTransit}
                        </div>
                      </div>
                    )}
                    <div className="h-[400px] rounded-lg overflow-hidden">
                      <PropertyMapView properties={[property]} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Video Tour */}
          {property.videoTourUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Tour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={property.videoTourUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Contact Name
                  </div>
                  <div className="font-semibold">{property.contactName}</div>
                </div>

                {property.contactInfo.phone && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Phone
                    </div>
                    <a
                      href={`tel:${property.contactInfo.phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {property.contactInfo.phone}
                    </a>
                  </div>
                )}

                {property.contactInfo.email && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Email
                    </div>
                    <a
                      href={`mailto:${property.contactInfo.email}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {property.contactInfo.email}
                    </a>
                  </div>
                )}

                {property.preferredContactMethod.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Preferred Contact Method
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {property.preferredContactMethod.map((method) => (
                        <Badge
                          key={method}
                          variant="secondary"
                          className="capitalize"
                        >
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.viewingAvailability && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Viewing Availability
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {property.viewingAvailability}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {property.maintenanceResponsibility !== undefined && (
                  <div>
                    <div className="text-muted-foreground">
                      Maintenance Responsibility
                    </div>
                    <div className="font-semibold">
                      {property.maintenanceResponsibility
                        ? "Tenant"
                        : "Landlord"}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">Listed</div>
                  <div className="font-semibold">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
