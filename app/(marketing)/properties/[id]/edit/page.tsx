"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useSupabaseRealtimeSingle } from "@/hooks/use-supabase-realtime";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PropertyFormSteps } from "../../_components/property-form-steps";
import { propertyService } from "@/lib/services/property.service";
import type { Property } from "@/lib/types/property.type";
import type { PropertyFormData } from "../../_components/property-form-schema";
import { PropertyDetailLoading } from "../_components/property-detail-loading";
import { PropertyDetailError } from "../_components/property-detail-error";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAppStore();
  const isAuthenticated = useRequireAuth("Please sign in to edit properties");
  const id = params.id as string;
  const [propertyId] = useState<string>(id);

  const { data, loading, error } = useSupabaseRealtimeSingle<Property>(
    "properties",
    id
  );

  const property = data;

  // Redirect if user is not the owner
  useEffect(() => {
    if (property && user && property.userId !== user.uid) {
      toast.error("You don't have permission to edit this property");
      router.push(`/properties/${id}`);
    }
  }, [property, user, id, router]);

  const handleSubmit = async (data: PropertyFormData) => {
    try {
      await propertyService.update(propertyId, {
        title: data.title,
        listingType: data.listingType,
        propertyType: data.propertyType,
        numBedrooms: data.numBedrooms,
        numBathrooms: data.numBathrooms,
        furnishing: data.furnishing,
        area: data.area,
        floorNumber: data.floorNumber,
        totalFloors: data.totalFloors,
        price: data.listingType === "sale" ? data.price : undefined,
        rent:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.rent
            : undefined,
        securityDeposit:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.securityDeposit
            : undefined,
        leaseLength:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.leaseLength
            : undefined,
        availableFrom:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.availableFrom
            : undefined,
        paymentFrequency:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.paymentFrequency
            : undefined,
        utilitiesIncluded:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.utilitiesIncluded
            : undefined,
        isShared:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.isShared
            : undefined,
        sharingDetails:
          data.listingType === "rent" || data.listingType === "student-housing"
            ? data.isShared
              ? data.sharingDetails
              : undefined
            : undefined,
        parkingAvailable: data.parkingAvailable,
        laundry: data.laundry,
        heatingCooling: data.heatingCooling,
        balcony: data.balcony,
        wifi: (data as any).wifi,
        gym: (data as any).gym,
        pool: (data as any).pool,
        elevator: (data as any).elevator,
        security: (data as any).security,
        garden: (data as any).garden,
        dishwasher: (data as any).dishwasher,
        fireplace: (data as any).fireplace,
        otherAmenities: data.otherAmenities,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        nearbyTransit: data.nearbyTransit,
        location: data.location,
        smokingAllowed: data.smokingAllowed,
        petsAllowed: data.petsAllowed,
        guestsAllowed: data.guestsAllowed,
        sublettingAllowed: data.sublettingAllowed,
        partiesAllowed: (data as any).partiesAllowed,
        quietHours: (data as any).quietHours,
        maintenanceResponsibility: (data as any).maintenanceResponsibility,
        contactName: data.contactName,
        preferredContactMethod: [data.preferredContactMethod],
        contactInfo: data.contactInfo,
        viewingAvailability: data.viewingAvailability,
        images: data.images,
        videoTourUrl: data.videoTourUrl,
      });
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Failed to update property listing. Please try again.");
      throw error;
    }
  };

  const handleSuccess = () => {
    setTimeout(() => {
      router.push(`/properties/${propertyId}`);
    }, 2500);
  };

  if (loading) {
    return <PropertyDetailLoading />;
  }

  if (error || !property) {
    return <PropertyDetailError message={error?.message} />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (property.userId !== user.uid) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have permission to edit this property.
          </p>
        </div>
      </div>
    );
  }

  // Convert property to form data format
  const initialData: Partial<PropertyFormData> = {
    title: property.title,
    listingType: property.listingType,
    propertyType: property.propertyType,
    numBedrooms: property.numBedrooms,
    numBathrooms: property.numBathrooms,
    furnishing: property.furnishing,
    area: property.area,
    floorNumber: property.floorNumber,
    totalFloors: property.totalFloors,
    price: property.price,
    rent: property.rent,
    securityDeposit: property.securityDeposit,
    leaseLength: property.leaseLength,
    availableFrom: property.availableFrom,
    paymentFrequency: property.paymentFrequency,
    utilitiesIncluded: property.utilitiesIncluded,
    isShared: property.isShared,
    sharingDetails: property.sharingDetails,
    parkingAvailable: property.parkingAvailable,
    laundry: property.laundry,
    heatingCooling: property.heatingCooling,
    balcony: property.balcony,
    wifi: (property as any).wifi,
    gym: (property as any).gym,
    pool: (property as any).pool,
    elevator: (property as any).elevator,
    security: (property as any).security,
    garden: (property as any).garden,
    dishwasher: (property as any).dishwasher,
    fireplace: (property as any).fireplace,
    otherAmenities: property.otherAmenities,
    address: property.address,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
    nearbyTransit: property.nearbyTransit,
    location: property.location,
    smokingAllowed: property.smokingAllowed,
    petsAllowed: property.petsAllowed,
    guestsAllowed: property.guestsAllowed,
    sublettingAllowed: property.sublettingAllowed,
    partiesAllowed: (property as any).partiesAllowed,
    quietHours: (property as any).quietHours,
    maintenanceResponsibility: (property as any).maintenanceResponsibility,
    contactName: property.contactName,
    preferredContactMethod: Array.isArray(property.preferredContactMethod)
      ? property.preferredContactMethod[0]
      : property.preferredContactMethod,
    contactInfo: property.contactInfo,
    viewingAvailability: property.viewingAvailability,
    images: property.images,
    videoTourUrl: property.videoTourUrl,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
        <p className="text-muted-foreground">
          Update your property listing information below.
        </p>
      </div>

      <PropertyFormSteps
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        initialData={initialData}
      />
    </div>
  );
}
