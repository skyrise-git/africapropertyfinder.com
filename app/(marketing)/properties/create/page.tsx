"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PropertyFormSteps } from "../_components/property-form-steps";
import { propertyService } from "@/lib/services/property.service";
import type { PropertyFormData } from "../_components/property-form-schema";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const isAuthenticated = useRequireAuth("Please sign in to create a property listing");
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const handleSubmit = async (data: PropertyFormData) => {
    try {
      // Clean up deleted images from UploadThing (handled in form component)
      // Here we just save the property

      const id = await propertyService.create({
        userId: user?.uid,
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

      setPropertyId(id);
      // Success dialog will be shown by PropertyFormSteps
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to create property listing. Please try again.");
      throw error; // Re-throw to let PropertyFormSteps handle the error state
    }
  };

  const handleSuccess = () => {
    // Redirect after showing success dialog
    if (propertyId) {
      setTimeout(() => {
        router.push(`/properties/${propertyId}`);
      }, 2500);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight">
          List Your Property
        </h1>
        <p className="text-muted-foreground">
          Fill out the form below to list your property. All fields marked with
          * are required.
        </p>
      </div>

      <PropertyFormSteps onSubmit={handleSubmit} onSuccess={handleSuccess} />
    </div>
  );
}
