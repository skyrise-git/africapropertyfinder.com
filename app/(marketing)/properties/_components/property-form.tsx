"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useQueryState, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationMapPicker } from "@/components/map/location-map-picker";
import { useUploadThing } from "@/lib/utils/uploadthing";
import {
  refinedPropertyFormSchema,
  type PropertyFormData,
} from "./property-form-schema";
import type { Location, Image } from "@/lib/types/property.type";
import { X, Plus, Upload } from "lucide-react";
import { formatFileSize } from "@/lib/utils/image-optimization";

interface PropertyFormProps {
  step: number;
  formData: Partial<PropertyFormData>;
  onNext: (data: Partial<PropertyFormData>) => void;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onPrevious: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export const PropertyForm = forwardRef<
  { triggerSubmit: () => void },
  PropertyFormProps
>(({ step, formData, onNext, onSubmit, onPrevious, canGoBack, isLastStep }, ref) => {
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: async (res) => {
      if (res?.[0]?.url && res?.[0]?.key) {
        const newImage: Image = {
          url: res[0].url,
          path: res[0].name || "",
          fileKey: res[0].key,
        };

        const currentImages = form.getValues("images") || [];
        form.setValue("images", [...currentImages, newImage]);
        toast.success("Image uploaded successfully!");
      }
    },
    onUploadError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(refinedPropertyFormSchema),
    defaultValues: {
      listingType: (formData.listingType as PropertyFormData["listingType"]) || "sale",
      title: formData.title || "",
      propertyType: (formData.propertyType as PropertyFormData["propertyType"]) || "apartment",
      numBedrooms: formData.numBedrooms || 0,
      numBathrooms: formData.numBathrooms || 0,
      furnishing: (formData.furnishing as PropertyFormData["furnishing"]) || "unfurnished",
      area: formData.area || 0,
      floorNumber: formData.floorNumber,
      totalFloors: formData.totalFloors,
      price: (formData as any).price,
      rent: (formData as any).rent,
      securityDeposit: (formData as any).securityDeposit,
      leaseLength: (formData as any).leaseLength,
      availableFrom: (formData as any).availableFrom,
      paymentFrequency: ((formData as any).paymentFrequency || "monthly") as "monthly" | "weekly" | "yearly",
      utilitiesIncluded: (formData as any).utilitiesIncluded,
      isShared: (formData as any).isShared,
      sharingDetails: (formData as any).sharingDetails,
      parkingAvailable: formData.parkingAvailable,
      laundry: formData.laundry,
      heatingCooling: formData.heatingCooling,
      balcony: formData.balcony,
      otherAmenities: formData.otherAmenities,
      address: formData.address || "",
      city: formData.city || "",
      state: formData.state || "",
      zipCode: formData.zipCode,
      nearbyTransit: formData.nearbyTransit,
      location: formData.location || { latitude: 0, longitude: 0 },
      smokingAllowed: formData.smokingAllowed,
      petsAllowed: formData.petsAllowed,
      guestsAllowed: formData.guestsAllowed,
      sublettingAllowed: formData.sublettingAllowed,
      contactName: formData.contactName || "",
      preferredContactMethod: formData.preferredContactMethod || [],
      contactInfo: formData.contactInfo || { phone: "", email: "" },
      viewingAvailability: formData.viewingAvailability,
      images: formData.images || [],
      videoTourUrl: formData.videoTourUrl,
    },
  });

  const watchedListingType = form.watch("listingType");
  const watchedIsShared = form.watch("isShared");
  const watchedImages = form.watch("images") || [];

  // Sync form data when formData prop changes
  useEffect(() => {
    if (formData) {
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof PropertyFormData];
        if (value !== undefined) {
          form.setValue(key as any, value as any);
        }
      });
    }
  }, [formData, form]);

  // Delete image from UploadThing and form
  const deleteImage = async (image: Image, index: number) => {
    try {
      // Delete from UploadThing
      if (image.fileKey) {
        const response = await fetch(
          `/api/uploadthing/delete?fileKey=${encodeURIComponent(image.fileKey)}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete file");
        }
      }

      // Remove from form
      const currentImages = form.getValues("images") || [];
      form.setValue(
        "images",
        currentImages.filter((_, i) => i !== index),
      );

      // Track for database cleanup
      if (image.fileKey) {
        setImagesToDelete((prev) => [...prev, image.fileKey]);
      }

      toast.success("Image deleted");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    try {
      await startUpload([file]);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleFormSubmit = async (data: PropertyFormData) => {
    if (isLastStep) {
      await onSubmit(data);
    } else {
      onNext(data);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerSubmit: () => {
      form.handleSubmit(handleFormSubmit)();
    },
  }));

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <LocationStep form={form} onFormChange={onFormChange} />;
      case 2:
        return <BasicInfoStep form={form} />;
      case 3:
        return <PricingStep form={form} watchedListingType={watchedListingType} />;
      case 4:
        return (
          <SharedPropertyStep
            form={form}
            watchedListingType={watchedListingType}
            watchedIsShared={watchedIsShared}
          />
        );
      case 5:
        return <AmenitiesStep form={form} />;
      case 6:
        return <PoliciesStep form={form} />;
      case 7:
        return <ContactStep form={form} />;
      case 8:
        return (
          <PhotosStep
            form={form}
            watchedImages={watchedImages}
            isUploading={isUploading}
            onFileSelect={handleFileSelect}
            onDeleteImage={deleteImage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {renderStepContent()}
        <div className="hidden">
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  );
});

PropertyForm.displayName = "PropertyForm";

// Step 1: Location Selection
function LocationStep({
  form,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
}) {
  // URL-backed state for location so it survives refresh and can be read from other components
  const [locLat, setLocLat] = useQueryState(
    "locLat",
    parseAsString.withDefault("0"),
  );
  const [locLng, setLocLng] = useQueryState(
    "locLng",
    parseAsString.withDefault("0"),
  );
  const [locAddress, setLocAddress] = useQueryState(
    "locAddress",
    parseAsString.withDefault(""),
  );
  const [locCity, setLocCity] = useQueryState(
    "locCity",
    parseAsString.withDefault(""),
  );
  const [locState, setLocState] = useQueryState(
    "locState",
    parseAsString.withDefault(""),
  );
  const [locZip, setLocZip] = useQueryState(
    "locZip",
    parseAsString.withDefault(""),
  );

  // Seed form values from URL on first render if location is present
  useEffect(() => {
    if (locLat && locLng && (locLat !== "0" || locLng !== "0")) {
      const latitude = Number(locLat);
      const longitude = Number(locLng);

      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        const currentLocation = form.getValues("location");
        const isDefaultLocation =
          !currentLocation ||
          (currentLocation.latitude === 0 && currentLocation.longitude === 0);

        if (isDefaultLocation) {
          form.setValue("location", { latitude, longitude });
        }
      }
    }

    if (locAddress) {
      form.setValue("address", locAddress);
    }
    if (locCity) {
      form.setValue("city", locCity);
    }
    if (locState) {
      form.setValue("state", locState);
    }
    if (locZip) {
      form.setValue("zipCode", locZip);
    }
  }, [locLat, locLng, locAddress, locCity, locState, locZip, form]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Selection</CardTitle>
        <CardDescription>
          Search for an address and confirm the location on the map. This is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Location *</FormLabel>
              <FormControl>
                <LocationMapPicker
                  value={
                    field.value
                      ? {
                          latitude: field.value.latitude,
                          longitude: field.value.longitude,
                          address: form.getValues("address") || "",
                          city: form.getValues("city") || "",
                          state: form.getValues("state") || "",
                          zipCode: form.getValues("zipCode") || "",
                        }
                      : null
                  }
                  onChange={(location: Location) => {
                    const locationValue = {
                      latitude: location.latitude,
                      longitude: location.longitude,
                    };
                    field.onChange(locationValue);
                    form.setValue("address", location.address);
                    form.setValue("city", location.city);
                    form.setValue("state", location.state);
                    form.setValue("zipCode", location.zipCode);
                    // Trigger validation for location field
                    form.trigger("location");
                    // Persist location to URL using nuqs so it survives refresh and can be read elsewhere
                    setLocLat(String(location.latitude));
                    setLocLng(String(location.longitude));
                    setLocAddress(location.address);
                    setLocCity(location.city);
                    setLocState(location.state);
                    setLocZip(location.zipCode || "");
                  }}
                  error={form.formState.errors.location?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nearbyTransit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nearby Transit</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe nearby transit options (e.g., '5 min walk to Metro station')"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

// Step 2: Listing Type & Basic Info
function BasicInfoStep({ form }: { form: ReturnType<typeof useForm<PropertyFormData>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Tell us about your property</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="listingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Listing Type *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-row gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sale" id="sale" />
                    <label htmlFor="sale" className="cursor-pointer">
                      Sale
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rent" id="rent" />
                    <label htmlFor="rent" className="cursor-pointer">
                      Rent
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student-housing" id="student-housing" />
                    <label htmlFor="student-housing" className="cursor-pointer">
                      Student Housing
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Title *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Beautiful 2BR Apartment in Downtown" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="furnishing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Furnishing *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select furnishing" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="furnished">Furnished</SelectItem>
                    <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="numBedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrooms *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numBathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathrooms *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area (sq ft) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    min={0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="floorNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    min={0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalFloors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Floors</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    min={0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3: Pricing & Rent Details
function PricingStep({
  form,
  watchedListingType,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
  watchedListingType: PropertyFormData["listingType"];
}) {
  if (watchedListingType === "sale") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Set the sale price for your property</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Price *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    min={0}
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent & Payment Details</CardTitle>
        <CardDescription>Set rental price and payment terms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="rent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Rent *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  min={0}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="securityDeposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Deposit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    min={0}
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="leaseLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lease Length (months) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    min={1}
                    placeholder="12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="availableFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available From *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Frequency *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="utilitiesIncluded"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Utilities Included</FormLabel>
                <FormDescription>
                  Are utilities (water, electricity, gas) included in the rent?
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

// Step 4: Shared Property Details
function SharedPropertyStep({
  form,
  watchedListingType,
  watchedIsShared,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
  watchedListingType: PropertyFormData["listingType"];
  watchedIsShared?: boolean;
}) {
  if (watchedListingType === "sale") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared Property Details</CardTitle>
        <CardDescription>
          Is this a shared property? If yes, provide additional details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="isShared"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Is this a shared property?</FormLabel>
                <FormDescription>
                  Check this if the property will be shared with other tenants
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {watchedIsShared && (
          <>
            <FormField
              control={form.control}
              name="sharingDetails.sharingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sharing Type *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const currentDetails = form.getValues("sharingDetails");
                      form.setValue("sharingDetails", {
                        sharingType: value as "room" | "apartment" | "house",
                        currentOccupants: currentDetails?.currentOccupants ?? 0,
                        preferredTenantType: currentDetails?.preferredTenantType ?? "anyone",
                      });
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sharing type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sharingDetails.currentOccupants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Occupants *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const currentDetails = form.getValues("sharingDetails");
                        form.setValue("sharingDetails", {
                          sharingType: currentDetails?.sharingType ?? "room",
                          currentOccupants: value,
                          preferredTenantType: currentDetails?.preferredTenantType ?? "anyone",
                        });
                        field.onChange(value);
                      }}
                      min={0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sharingDetails.preferredTenantType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Tenant Type *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const currentDetails = form.getValues("sharingDetails");
                      form.setValue("sharingDetails", {
                        sharingType: currentDetails?.sharingType ?? "room",
                        currentOccupants: currentDetails?.currentOccupants ?? 0,
                        preferredTenantType: value as
                          | "students"
                          | "professionals"
                          | "families"
                          | "anyone",
                      });
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred tenant type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="professionals">Professionals</SelectItem>
                      <SelectItem value="families">Families</SelectItem>
                      <SelectItem value="anyone">Anyone</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Step 5: Amenities
function AmenitiesStep({ form }: { form: ReturnType<typeof useForm<PropertyFormData>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
        <CardDescription>Select the amenities available in your property</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="parkingAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Parking Available</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="laundry"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Laundry</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heatingCooling"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Heating & Cooling</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="balcony"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Balcony</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="otherAmenities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Other Amenities</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="List any other amenities (e.g., gym, pool, garden)"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

// Step 6: Policies
function PoliciesStep({ form }: { form: ReturnType<typeof useForm<PropertyFormData>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policies</CardTitle>
        <CardDescription>Set property policies and rules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="smokingAllowed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Smoking Allowed</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="petsAllowed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Pets Allowed</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guestsAllowed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Guests Allowed</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sublettingAllowed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <FormLabel>Subletting Allowed</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Step 7: Contact & Viewing
function ContactStep({ form }: { form: ReturnType<typeof useForm<PropertyFormData>> }) {
  const watchedContactMethods = form.watch("preferredContactMethod") || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Viewing</CardTitle>
        <CardDescription>How can interested parties contact you?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredContactMethod"
          render={() => (
            <FormItem>
              <FormLabel>Preferred Contact Method *</FormLabel>
              <div className="space-y-2">
                {(["phone", "email", "both"] as const).map((method) => (
                  <FormField
                    key={method}
                    control={form.control}
                    name="preferredContactMethod"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={method}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(method)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, method])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== method),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {method === "both" ? "Both Phone & Email" : method}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {(watchedContactMethods.includes("phone") ||
          watchedContactMethods.includes("both")) && (
          <FormField
            control={form.control}
            name="contactInfo.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="+1 (555) 123-4567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(watchedContactMethods.includes("email") ||
          watchedContactMethods.includes("both")) && (
          <FormField
            control={form.control}
            name="contactInfo.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="your@email.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="viewingAvailability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Viewing Availability</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="e.g., Weekdays 9am-5pm, Weekends by appointment"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

// Step 8: Photos & Media
function PhotosStep({
  form,
  watchedImages,
  isUploading,
  onFileSelect,
  onDeleteImage,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
  watchedImages: Image[];
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onDeleteImage: (image: Image, index: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos & Media</CardTitle>
        <CardDescription>Upload photos of your property</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Photos *</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="image-upload"
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 hover:bg-muted"
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onFileSelect(file);
                        }
                      }}
                      disabled={isUploading}
                    />
                  </div>

                  {watchedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {watchedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={`Property ${index + 1}`}
                            className="h-48 w-full rounded-md object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onDeleteImage(image, index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {watchedImages.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No images uploaded yet. At least one image is required.
                    </p>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="videoTourUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Tour URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </FormControl>
              <FormDescription>
                Link to a video tour of your property (YouTube, Vimeo, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

