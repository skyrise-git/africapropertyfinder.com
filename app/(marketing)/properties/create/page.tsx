"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PropertyFormSteps } from "../_components/property-form-steps";
import { propertyService } from "@/lib/services/property.service";
import type { PropertyFormData } from "../_components/property-form-schema";

export default function CreatePropertyPage() {
  const router = useRouter();

  const handleSubmit = async (data: PropertyFormData) => {
    try {
      // Clean up deleted images from UploadThing (handled in form component)
      // Here we just save the property

      const propertyId = await propertyService.create({
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
            ? data.sharingDetails
            : undefined,
        parkingAvailable: data.parkingAvailable,
        laundry: data.laundry,
        heatingCooling: data.heatingCooling,
        balcony: data.balcony,
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
        contactName: data.contactName,
        preferredContactMethod: data.preferredContactMethod,
        contactInfo: data.contactInfo,
        viewingAvailability: data.viewingAvailability,
        images: data.images,
        videoTourUrl: data.videoTourUrl,
      });

      toast.success("Property listed successfully!");
      router.push(`/properties/${propertyId}`);
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to create property listing. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          List Your Property
        </h1>
        <p className="text-muted-foreground">
          Fill out the form below to list your property. All fields marked with
          * are required.
        </p>
      </div>

      <PropertyFormSteps onSubmit={handleSubmit} />
    </div>
  );
}
