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
import {
  X,
  Plus,
  Upload,
  Home,
  Tag,
  Sofa,
  Bed,
  Bath,
  Square,
  Building2,
  Layers,
  HomeIcon,
  DollarSign,
  GraduationCap,
  MoreHorizontal,
  Package,
  Phone,
  Mail,
  PhoneCall,
  Car,
  Shirt,
  Wind,
  Sun,
  Wifi,
  Dumbbell,
  Waves,
  ArrowUpDown,
  Shield,
  TreePine,
  UtensilsCrossed,
  Flame,
  Volume2,
  Music,
  Clock,
  Wrench,
  Key,
  Users,
  Briefcase,
  Baby,
  UserCheck,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils/image-optimization";
import { ImageEditor } from "@/components/ui/image-editor";
import { useAppStore } from "@/hooks/use-app-store";

interface PropertyFormProps {
  step: number;
  formData: Partial<PropertyFormData>;
  onNext: (data: Partial<PropertyFormData>) => void;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onPrevious: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const PropertyForm = forwardRef<
  { triggerSubmit: () => void; isUploading: boolean },
  PropertyFormProps
>(
  (
    { step, formData, onNext, onSubmit, onPrevious, canGoBack, isLastStep, onLoadingChange },
    ref
  ) => {
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [pendingImages, setPendingImages] = useState<
      Array<{ file: File; preview: string }>
    >([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const { user } = useAppStore();

    // Read location from URL for initial form values
    const [locLat] = useQueryState("locLat", parseAsString.withDefault("0"));
    const [locLng] = useQueryState("locLng", parseAsString.withDefault("0"));
    const [locAddress] = useQueryState(
      "locAddress",
      parseAsString.withDefault("")
    );
    const [locCity] = useQueryState("locCity", parseAsString.withDefault(""));
    const [locState] = useQueryState("locState", parseAsString.withDefault(""));
    const [locZip] = useQueryState("locZip", parseAsString.withDefault(""));

    // Build initial location from URL if available
    const initialLocation =
      locLat && locLng && (locLat !== "0" || locLng !== "0")
        ? {
            latitude: Number(locLat),
            longitude: Number(locLng),
          }
        : formData.location || { latitude: 0, longitude: 0 };

    console.log("🏗️ Form initialization - initialLocation:", initialLocation);
    console.log("🏗️ Form initialization - locLat:", locLat, "locLng:", locLng);
    console.log(
      "🏗️ Form initialization - formData.location:",
      formData.location
    );

    const { startUpload, isUploading } = useUploadThing("multipleImageUploader", {
      onClientUploadComplete: async (res) => {
        // This will be called when we upload on submit
        console.log("Upload complete:", res);
      },
      onUploadError: (error: Error) => {
        toast.error(`Upload failed: ${error.message}`);
      },
    });

    const form = useForm<PropertyFormData>({
      resolver: zodResolver(refinedPropertyFormSchema),
      defaultValues: {
        listingType:
          (formData.listingType as PropertyFormData["listingType"]) || "sale",
        title: formData.title || "",
        propertyType:
          (formData.propertyType as PropertyFormData["propertyType"]) ||
          "apartment",
        numBedrooms: formData.numBedrooms || 0,
        numBathrooms: formData.numBathrooms || 0,
        furnishing:
          (formData.furnishing as PropertyFormData["furnishing"]) ||
          "unfurnished",
        area: formData.area ?? undefined,
        floorNumber: formData.floorNumber ?? undefined,
        totalFloors: formData.totalFloors ?? undefined,
        price: (formData as any).price ?? undefined,
        rent: (formData as any).rent ?? undefined,
        securityDeposit: (formData as any).securityDeposit ?? undefined,
        leaseLength: (formData as any).leaseLength ?? undefined,
        availableFrom: (formData as any).availableFrom ?? undefined,
        paymentFrequency: ((formData as any).paymentFrequency || "monthly") as
          | "monthly"
          | "weekly"
          | "yearly",
        utilitiesIncluded: (formData as any).utilitiesIncluded ?? false,
        isShared: (formData as any).isShared ?? false,
        sharingDetails: (formData as any).sharingDetails,
        parkingAvailable: formData.parkingAvailable ?? false,
        laundry: formData.laundry ?? false,
        heatingCooling: formData.heatingCooling ?? false,
        balcony: formData.balcony ?? false,
        wifi: (formData as any).wifi ?? false,
        gym: (formData as any).gym ?? false,
        pool: (formData as any).pool ?? false,
        elevator: (formData as any).elevator ?? false,
        security: (formData as any).security ?? false,
        garden: (formData as any).garden ?? false,
        dishwasher: (formData as any).dishwasher ?? false,
        fireplace: (formData as any).fireplace ?? false,
        otherAmenities: formData.otherAmenities ?? undefined,
        address: formData.address || locAddress || "",
        city: formData.city || locCity || "",
        state: formData.state || locState || "",
        zipCode: formData.zipCode || locZip || undefined,
        nearbyTransit: formData.nearbyTransit ?? undefined,
        location: initialLocation,
        smokingAllowed: formData.smokingAllowed ?? false,
        petsAllowed: formData.petsAllowed ?? false,
        guestsAllowed: formData.guestsAllowed ?? false,
        sublettingAllowed: formData.sublettingAllowed ?? false,
        partiesAllowed: (formData as any).partiesAllowed ?? false,
        quietHours: (formData as any).quietHours ?? false,
        maintenanceResponsibility: (formData as any).maintenanceResponsibility ?? false,
        contactName: formData.contactName || "",
        preferredContactMethod: Array.isArray(formData.preferredContactMethod)
          ? (formData.preferredContactMethod[0] as PropertyFormData["preferredContactMethod"]) || "phone"
          : ((formData.preferredContactMethod as PropertyFormData["preferredContactMethod"]) || "phone"),
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
            `/api/uploadthing/delete?fileKey=${encodeURIComponent(
              image.fileKey
            )}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            throw new Error("Failed to delete file");
          }
        }

        // Remove from form
        const currentImages = form.getValues("images") || [];
        form.setValue(
          "images",
          currentImages.filter((_, i) => i !== index)
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

    const handleFileSelect = (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      setShowImageEditor(true);
    };

    const handleImageEditorSave = (optimizedFile: File) => {
      // Create preview URL
      const preview = URL.createObjectURL(optimizedFile);
      setPendingImages((prev) => [...prev, { file: optimizedFile, preview }]);
      setShowImageEditor(false);
      setSelectedFile(null);
      toast.success("Image added! It will be uploaded when you submit.");
    };

    const handleImageEditorCancel = () => {
      setShowImageEditor(false);
      setSelectedFile(null);
    };

    const handleDeletePendingImage = (index: number) => {
      setPendingImages((prev) => {
        const newImages = [...prev];
        URL.revokeObjectURL(newImages[index].preview);
        newImages.splice(index, 1);
        return newImages;
      });
    };

    const handleFormSubmit = async (data: PropertyFormData) => {
      console.log("✅ handleFormSubmit called with data:", data);
      console.log("📍 Location in submitted data:", data.location);
      console.log("📋 Form errors:", form.formState.errors);
      console.log("✅ Form is valid:", form.formState.isValid);

      if (isLastStep) {
        // Upload pending images first
        if (pendingImages.length > 0) {
          try {
            onLoadingChange?.(true);
            toast.loading(`Uploading ${pendingImages.length} image(s)...`, {
              id: "uploading-images",
            });

            const uid = user?.uid || "anonymous";
            
            // Rename all files with uid-Date.now().webp format
            const filesToUpload = pendingImages.map(({ file }, index) => {
              const timestamp = Date.now() + index; // Add index to ensure uniqueness
              const newFileName = `${uid}-${timestamp}.webp`;
              return new File([file], newFileName, { type: "image/webp" });
            });

            // Upload all images at once
            const uploadResults = await startUpload(filesToUpload);

            const uploadedImages: Image[] = [];
            if (uploadResults && uploadResults.length > 0) {
              uploadResults.forEach((result, index) => {
                uploadedImages.push({
                  url: result.url,
                  path: result.name || filesToUpload[index].name,
                  fileKey: result.key,
                });
              });
            }

            if (uploadedImages.length > 0) {
              // Add uploaded images to form data
              const currentImages = data.images || [];
              data.images = [...currentImages, ...uploadedImages];

              // Clean up preview URLs
              pendingImages.forEach(({ preview }) => {
                URL.revokeObjectURL(preview);
              });
              setPendingImages([]);

              toast.success(
                `Successfully uploaded ${uploadedImages.length} image(s)!`,
                { id: "uploading-images" },
              );
            } else {
              throw new Error("No images were uploaded");
            }
          } catch (error) {
            console.error("Error uploading images:", error);
            toast.error("Failed to upload images. Please try again.", {
              id: "uploading-images",
            });
            onLoadingChange?.(false);
            return;
          }
        }

        await onSubmit(data);
        onLoadingChange?.(false);
      } else {
        onNext(data);
      }
    };

    // Get fields to validate based on current step
    const getFieldsToValidate = (currentStep: number): string[] => {
      switch (currentStep) {
        case 1:
          return ["location"]; // address, city, state, zipCode are set automatically when location is selected
        case 2:
          return ["propertyType"];
        case 3:
          return [
            "listingType",
            "title",
            "numBedrooms",
            "numBathrooms",
            "furnishing",
            // area is optional, so not included in validation
            "floorNumber",
            "totalFloors",
          ];
        case 4:
          const listingType = form.getValues("listingType");
          if (listingType === "sale") {
            return ["price"];
          } else {
            return [
              "rent",
              "securityDeposit",
              "leaseLength",
              "availableFrom",
              "paymentFrequency",
              "utilitiesIncluded",
            ];
          }
        case 5:
          const listingTypeForStep5 = form.getValues("listingType");
          if (listingTypeForStep5 === "sale") {
            return []; // No validation needed for sale listings
          }
          return ["isShared", "sharingDetails"];
        case 6:
          return [
            "parkingAvailable",
            "laundry",
            "heatingCooling",
            "balcony",
            "wifi",
            "gym",
            "pool",
            "elevator",
            "security",
            "garden",
            "dishwasher",
            "fireplace",
            "otherAmenities",
          ];
        case 7:
          return [
            "smokingAllowed",
            "petsAllowed",
            "guestsAllowed",
            "sublettingAllowed",
            "partiesAllowed",
            "quietHours",
            "maintenanceResponsibility",
          ];
        case 8:
          const preferredMethod = form.getValues("preferredContactMethod");
          const fieldsToValidate = ["contactName", "preferredContactMethod"];
          if (preferredMethod === "phone" || preferredMethod === "both") {
            fieldsToValidate.push("contactInfo.phone");
          }
          if (preferredMethod === "email" || preferredMethod === "both") {
            fieldsToValidate.push("contactInfo.email");
          }
          return fieldsToValidate;
        case 9:
          // Validate that we have at least one image (uploaded or pending)
          const currentImages = form.getValues("images") || [];
          const pendingCount = pendingImages.length;
          if (currentImages.length === 0 && pendingCount === 0) {
            return ["images"];
          }
          return ["videoTourUrl"];
        default:
          return [];
      }
    };

    useImperativeHandle(ref, () => ({
      triggerSubmit: () => {
        console.log("🔘 triggerSubmit called");
        console.log("📍 Current step:", step);
        console.log("📍 Current location value:", form.getValues("location"));
        console.log("📋 Current form errors:", form.formState.errors);

        // Special validation for step 9 (images)
        if (step === 9) {
          const currentImages = form.getValues("images") || [];
          const pendingCount = pendingImages.length;
          if (currentImages.length === 0 && pendingCount === 0) {
            form.setError("images", {
              type: "manual",
              message: "At least one image is required",
            });
            toast.error("Please add at least one image before submitting.");
            return;
          }
        }

        // Get fields to validate for current step
        const fieldsToValidate = getFieldsToValidate(step);
        console.log(
          "📋 Fields to validate for step",
          step,
          ":",
          fieldsToValidate
        );

        // Trigger validation only for current step fields
        // @ts-expect-error - react-hook-form trigger accepts string[] but types are strict
        form.trigger(fieldsToValidate).then((isValid) => {
          console.log("🔍 Validation result:", isValid);
          console.log("📋 Errors after trigger:", form.formState.errors);

          if (isValid) {
            console.log("✅ Step validation passed, proceeding to next step");
            // Get current form values and proceed without full form validation
            // This allows us to move between steps even if other steps aren't filled yet
            const currentFormData = form.getValues();
            console.log("📝 Current form data:", currentFormData);
            handleFormSubmit(currentFormData as PropertyFormData);
          } else {
            console.log("❌ Step validation failed, cannot proceed");
            console.log("📋 Detailed errors:", form.formState.errors);
            // Show errors for current step only
            const stepErrors: Record<string, any> = {};
            fieldsToValidate.forEach((field) => {
              if (
                form.formState.errors[
                  field as keyof typeof form.formState.errors
                ]
              ) {
                stepErrors[field] =
                  form.formState.errors[
                    field as keyof typeof form.formState.errors
                  ];
              }
            });
            console.log("📋 Step-specific errors:", stepErrors);
          }
        });
      },
      isUploading: isUploading || pendingImages.length > 0,
    }));

    // Render step content
    const renderStepContent = () => {
      switch (step) {
        case 1:
          return <LocationStep form={form} />;
        case 2:
          return <PropertyTypeStep form={form} />;
        case 3:
          return <BasicInfoStep form={form} />;
        case 4:
          return (
            <PricingStep form={form} watchedListingType={watchedListingType} />
          );
        case 5:
          return (
            <SharedPropertyStep
              form={form}
              watchedListingType={watchedListingType}
              watchedIsShared={watchedIsShared}
            />
          );
        case 6:
          return <AmenitiesStep form={form} />;
        case 7:
          return <PoliciesStep form={form} />;
        case 8:
          return <ContactStep form={form} />;
        case 9:
          return (
            <>
              <PhotosStep
                form={form}
                watchedImages={watchedImages}
                pendingImages={pendingImages}
                isUploading={isUploading}
                onFileSelect={handleFileSelect}
                onDeleteImage={deleteImage}
                onDeletePendingImage={handleDeletePendingImage}
              />
              {selectedFile && (
                <ImageEditor
                  imageFile={selectedFile}
                  onSave={handleImageEditorSave}
                  onCancel={handleImageEditorCancel}
                  open={showImageEditor}
                  aspectRatio={4 / 3}
                  circularCrop={false}
                  title="Crop & Optimize Image"
                  description="Crop your image to the desired size (4:3 aspect ratio). It will be automatically converted to WebP format for optimization."
                />
              )}
            </>
          );
        default:
          return null;
      }
    };

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          {renderStepContent()}
          <div className="hidden">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    );
  }
);

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
    parseAsString.withDefault("0")
  );
  const [locLng, setLocLng] = useQueryState(
    "locLng",
    parseAsString.withDefault("0")
  );
  const [locAddress, setLocAddress] = useQueryState(
    "locAddress",
    parseAsString.withDefault("")
  );
  const [locCity, setLocCity] = useQueryState(
    "locCity",
    parseAsString.withDefault("")
  );
  const [locState, setLocState] = useQueryState(
    "locState",
    parseAsString.withDefault("")
  );
  const [locZip, setLocZip] = useQueryState(
    "locZip",
    parseAsString.withDefault("")
  );

  // Seed form values from URL on first render if location is present
  useEffect(() => {
    console.log("🔄 LocationStep useEffect - syncing from URL");
    console.log("📍 URL values - locLat:", locLat, "locLng:", locLng);

    if (locLat && locLng && (locLat !== "0" || locLng !== "0")) {
      const latitude = Number(locLat);
      const longitude = Number(locLng);

      console.log(
        "📍 Parsed coordinates - latitude:",
        latitude,
        "longitude:",
        longitude
      );

      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        const currentLocation = form.getValues("location");
        console.log("📍 Current form location:", currentLocation);

        // Always sync from URL if URL has valid values and form doesn't match
        const shouldUpdate =
          !currentLocation ||
          currentLocation.latitude !== latitude ||
          currentLocation.longitude !== longitude;

        console.log("🔄 Should update location?", shouldUpdate);

        if (shouldUpdate) {
          console.log("✅ Setting location in form:", { latitude, longitude });
          form.setValue(
            "location",
            { latitude, longitude },
            { shouldValidate: true }
          );
          console.log(
            "📍 Location after setValue:",
            form.getValues("location")
          );
        }
      }
    }

    if (locAddress) {
      const currentAddress = form.getValues("address");
      if (currentAddress !== locAddress) {
        form.setValue("address", locAddress, { shouldValidate: true });
      }
    }
    if (locCity) {
      const currentCity = form.getValues("city");
      if (currentCity !== locCity) {
        form.setValue("city", locCity, { shouldValidate: true });
      }
    }
    if (locState) {
      const currentState = form.getValues("state");
      if (currentState !== locState) {
        form.setValue("state", locState, { shouldValidate: true });
      }
    }
    if (locZip) {
      const currentZip = form.getValues("zipCode");
      if (currentZip !== locZip) {
        form.setValue("zipCode", locZip, { shouldValidate: true });
      }
    }

    // Trigger validation for location field after syncing from URL
    if (locLat && locLng && (locLat !== "0" || locLng !== "0")) {
      console.log("🔍 Triggering location validation");
      form.trigger("location").then((isValid) => {
        console.log("🔍 Location validation result:", isValid);
        console.log("📋 Location errors:", form.formState.errors.location);
      });
    }
  }, [locLat, locLng, locAddress, locCity, locState, locZip, form]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Selection</CardTitle>
        <CardDescription>
          Search for an address and confirm the location on the map. This is
          required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <select
                  {...field}
                  value={field.value ?? "South Africa"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="South Africa">South Africa</option>
                  <option value="Zimbabwe">Zimbabwe</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  placeholder="Optional: Describe nearby transit options (e.g., '5 min walk to Metro station')"
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

// Step 2: Property Type Selection
function PropertyTypeStep({
  form,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Type</CardTitle>
        <CardDescription>Select the type of property you're listing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Type Selection */}
        <FormField
          control={form.control}
          name="propertyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Type *</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                  {[
                    {
                      value: "apartment",
                      label: "Apartment",
                      icon: Building2,
                      color: "text-blue-600",
                      bgColor: "bg-blue-50 dark:bg-blue-950/20",
                      borderColor: "border-blue-200 dark:border-blue-800",
                    },
                    {
                      value: "house",
                      label: "House",
                      icon: HomeIcon,
                      color: "text-green-600",
                      bgColor: "bg-green-50 dark:bg-green-950/20",
                      borderColor: "border-green-200 dark:border-green-800",
                    },
                    {
                      value: "condo",
                      label: "Condo",
                      icon: Building2,
                      color: "text-purple-600",
                      bgColor: "bg-purple-50 dark:bg-purple-950/20",
                      borderColor: "border-purple-200 dark:border-purple-800",
                    },
                    {
                      value: "townhouse",
                      label: "Townhouse",
                      icon: Building2,
                      color: "text-orange-600",
                      bgColor: "bg-orange-50 dark:bg-orange-950/20",
                      borderColor: "border-orange-200 dark:border-orange-800",
                    },
                    {
                      value: "studio",
                      label: "Studio",
                      icon: HomeIcon,
                      color: "text-pink-600",
                      bgColor: "bg-pink-50 dark:bg-pink-950/20",
                      borderColor: "border-pink-200 dark:border-pink-800",
                    },
                    {
                      value: "room",
                      label: "Room",
                      icon: HomeIcon,
                      color: "text-cyan-600",
                      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
                      borderColor: "border-cyan-200 dark:border-cyan-800",
                    },
                    {
                      value: "other",
                      label: "Other",
                      icon: MoreHorizontal,
                      color: "text-gray-600",
                      bgColor: "bg-gray-50 dark:bg-gray-950/20",
                      borderColor: "border-gray-200 dark:border-gray-800",
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isSelected = field.value === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                            : "border-border bg-muted/30 hover:bg-muted/50"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSelected && (
                          <motion.div
                            className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                            layoutId="propertyTypeBg"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <Icon
                            className={`h-6 w-6 ${
                              isSelected ? option.color : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

// Step 3: Basic Info
function BasicInfoStep({
  form,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
}) {
  const listingType = form.watch("listingType");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Tell us about your property</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animated Listing Type Tabs */}
        <FormField
          control={form.control}
          name="listingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Listing Type *</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "sale",
                      label: "Sale",
                      icon: DollarSign,
                      color: "text-green-600",
                      bgColor: "bg-green-50 dark:bg-green-950/20",
                      borderColor: "border-green-200 dark:border-green-800",
                    },
                    {
                      value: "rent",
                      label: "Rent",
                      icon: HomeIcon,
                      color: "text-blue-600",
                      bgColor: "bg-blue-50 dark:bg-blue-950/20",
                      borderColor: "border-blue-200 dark:border-blue-800",
                    },
                    {
                      value: "student-housing",
                      label: "Student Housing",
                      icon: GraduationCap,
                      color: "text-purple-600",
                      bgColor: "bg-purple-50 dark:bg-purple-950/20",
                      borderColor: "border-purple-200 dark:border-purple-800",
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isSelected = field.value === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                            : "border-border bg-muted/30 hover:bg-muted/50"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSelected && (
                          <motion.div
                            className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                            layoutId="listingTypeBg"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <Icon
                            className={`h-6 w-6 ${
                              isSelected ? option.color : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Property Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Property Title *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Beautiful 2BR Apartment in Downtown"
                    className="transition-all focus:scale-[1.01]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>

        {/* Furnishing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FormField
            control={form.control}
            name="furnishing"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Sofa className="h-4 w-4" />
                  Furnishing *
                </FormLabel>
                <FormControl>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        value: "furnished",
                        label: "Furnished",
                        icon: Sofa,
                        color: "text-green-600",
                        bgColor: "bg-green-50 dark:bg-green-950/20",
                        borderColor: "border-green-200 dark:border-green-800",
                      },
                      {
                        value: "semi-furnished",
                        label: "Semi-Furnished",
                        icon: Package,
                        color: "text-orange-600",
                        bgColor: "bg-orange-50 dark:bg-orange-950/20",
                        borderColor: "border-orange-200 dark:border-orange-800",
                      },
                      {
                        value: "unfurnished",
                        label: "Unfurnished",
                        icon: Square,
                        color: "text-gray-600",
                        bgColor: "bg-gray-50 dark:bg-gray-950/20",
                        borderColor: "border-gray-200 dark:border-gray-800",
                      },
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = field.value === option.value;
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                            isSelected
                              ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                              : "border-border bg-muted/30 hover:bg-muted/50"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isSelected && (
                            <motion.div
                              className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                              layoutId="furnishingBg"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center gap-2">
                            <Icon
                              className={`h-6 w-6 ${
                                isSelected ? option.color : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {option.label}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FormField
              control={form.control}
              name="numBedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    Bedrooms *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                          )
                        }
                        min={0}
                        className="transition-all focus:scale-[1.01]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FormField
              control={form.control}
              name="numBathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    Bathrooms *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                        )
                      }
                      min={0}
                      className="transition-all focus:scale-[1.01]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        </div>

        {/* Area, Floor Number, Total Floors */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Area (sq ft)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      min={0}
                      className="transition-all focus:scale-[1.01]"
                      placeholder="Optional"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <FormField
              control={form.control}
              name="floorNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Floor Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      min={0}
                      className="transition-all focus:scale-[1.01]"
                      placeholder="Optional"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <FormField
              control={form.control}
              name="totalFloors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Total Floors
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      min={0}
                      className="transition-all focus:scale-[1.01]"
                      placeholder="Optional"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
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
          <CardDescription>
            Set the sale price for your property
          </CardDescription>
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
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : parseFloat(e.target.value) || 0
                      )
                    }
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
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : parseFloat(e.target.value) || 0
                    )
                  }
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
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    min={0}
                    placeholder="Optional"
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
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : parseInt(e.target.value) || 0
                      )
                    }
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
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

// Step 5: Shared Property Details
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shared Property Details</CardTitle>
          <CardDescription>
            This step is not applicable for sale listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Shared property details are only relevant for rental and student housing listings. You can proceed to the next step.
          </p>
        </CardContent>
      </Card>
    );
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
                <FormLabel className="text-base">
                  Is this a shared property?
                </FormLabel>
                <FormDescription>
                  Check this if the property will be shared with other tenants
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) {
                      // Clear sharing details when isShared is set to false
                      form.setValue("sharingDetails", undefined);
                    }
                  }}
                />
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
                  <FormControl>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          value: "room",
                          label: "Room",
                          icon: HomeIcon,
                          color: "text-blue-600",
                          bgColor: "bg-blue-50 dark:bg-blue-950/20",
                          borderColor: "border-blue-200 dark:border-blue-800",
                        },
                        {
                          value: "apartment",
                          label: "Apartment",
                          icon: Building2,
                          color: "text-green-600",
                          bgColor: "bg-green-50 dark:bg-green-950/20",
                          borderColor: "border-green-200 dark:border-green-800",
                        },
                        {
                          value: "house",
                          label: "House",
                          icon: Home,
                          color: "text-purple-600",
                          bgColor: "bg-purple-50 dark:bg-purple-950/20",
                          borderColor: "border-purple-200 dark:border-purple-800",
                        },
                      ].map((option) => {
                        const Icon = option.icon;
                        const isSelected = field.value === option.value;
                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              const currentDetails = form.getValues("sharingDetails");
                              form.setValue("sharingDetails", {
                                sharingType: option.value as "room" | "apartment" | "house",
                                currentOccupants: currentDetails?.currentOccupants ?? 0,
                                preferredTenantType:
                                  currentDetails?.preferredTenantType ?? "anyone",
                              });
                              field.onChange(option.value);
                            }}
                            className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                              isSelected
                                ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                                : "border-border bg-muted/30 hover:bg-muted/50"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {isSelected && (
                              <motion.div
                                className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                                layoutId="sharingTypeBg"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <Icon
                                className={`h-6 w-6 ${
                                  isSelected ? option.color : "text-muted-foreground"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  isSelected ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </FormControl>
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
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                        const currentDetails = form.getValues("sharingDetails");
                        form.setValue("sharingDetails", {
                          sharingType: currentDetails?.sharingType ?? "room",
                          currentOccupants: value,
                          preferredTenantType:
                            currentDetails?.preferredTenantType ?? "anyone",
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
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        {
                          value: "students",
                          label: "Students",
                          icon: GraduationCap,
                          color: "text-blue-600",
                          bgColor: "bg-blue-50 dark:bg-blue-950/20",
                          borderColor: "border-blue-200 dark:border-blue-800",
                        },
                        {
                          value: "professionals",
                          label: "Professionals",
                          icon: Briefcase,
                          color: "text-green-600",
                          bgColor: "bg-green-50 dark:bg-green-950/20",
                          borderColor: "border-green-200 dark:border-green-800",
                        },
                        {
                          value: "families",
                          label: "Families",
                          icon: Baby,
                          color: "text-purple-600",
                          bgColor: "bg-purple-50 dark:bg-purple-950/20",
                          borderColor: "border-purple-200 dark:border-purple-800",
                        },
                        {
                          value: "anyone",
                          label: "Anyone",
                          icon: UserCheck,
                          color: "text-orange-600",
                          bgColor: "bg-orange-50 dark:bg-orange-950/20",
                          borderColor: "border-orange-200 dark:border-orange-800",
                        },
                      ].map((option) => {
                        const Icon = option.icon;
                        const isSelected = field.value === option.value;
                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              const currentDetails = form.getValues("sharingDetails");
                              form.setValue("sharingDetails", {
                                sharingType: currentDetails?.sharingType ?? "room",
                                currentOccupants: currentDetails?.currentOccupants ?? 0,
                                preferredTenantType: option.value as
                                  | "students"
                                  | "professionals"
                                  | "families"
                                  | "anyone",
                              });
                              field.onChange(option.value);
                            }}
                            className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                              isSelected
                                ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                                : "border-border bg-muted/30 hover:bg-muted/50"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {isSelected && (
                              <motion.div
                                className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                                layoutId="preferredTenantTypeBg"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <Icon
                                className={`h-6 w-6 ${
                                  isSelected ? option.color : "text-muted-foreground"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  isSelected ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </FormControl>
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

// Step 6: Amenities
function AmenitiesStep({
  form,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
}) {
  const amenities = [
    {
      name: "parkingAvailable" as const,
      label: "Parking Available",
      icon: Car,
    },
    {
      name: "laundry" as const,
      label: "Laundry",
      icon: Shirt,
    },
    {
      name: "heatingCooling" as const,
      label: "Heating & Cooling",
      icon: Wind,
    },
    {
      name: "balcony" as const,
      label: "Balcony",
      icon: Sun,
    },
    {
      name: "wifi" as const,
      label: "WiFi / Internet",
      icon: Wifi,
    },
    {
      name: "gym" as const,
      label: "Gym / Fitness Center",
      icon: Dumbbell,
    },
    {
      name: "pool" as const,
      label: "Swimming Pool",
      icon: Waves,
    },
    {
      name: "elevator" as const,
      label: "Elevator",
      icon: ArrowUpDown,
    },
    {
      name: "security" as const,
      label: "Security System",
      icon: Shield,
    },
    {
      name: "garden" as const,
      label: "Garden / Yard",
      icon: TreePine,
    },
    {
      name: "dishwasher" as const,
      label: "Dishwasher",
      icon: UtensilsCrossed,
    },
    {
      name: "fireplace" as const,
      label: "Fireplace",
      icon: Flame,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
        <CardDescription>
          Select the amenities available in your property
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {amenities.map((amenity) => {
            const Icon = amenity.icon;
            return (
              <FormField
                key={amenity.name}
                control={form.control}
                name={amenity.name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel
                      htmlFor={`amenity-${amenity.name}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      {amenity.label}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        id={`amenity-${amenity.name}`}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            );
          })}
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
                  placeholder="Optional: List any other amenities (e.g., gym, pool, garden)"
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

// Step 7: Policies
function PoliciesStep({
  form,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
}) {
  const policies = [
    {
      name: "smokingAllowed" as const,
      label: "Smoking Allowed",
      icon: Flame,
    },
    {
      name: "petsAllowed" as const,
      label: "Pets Allowed",
      icon: HomeIcon,
    },
    {
      name: "guestsAllowed" as const,
      label: "Guests Allowed",
      icon: Home,
    },
    {
      name: "sublettingAllowed" as const,
      label: "Subletting Allowed",
      icon: Key,
    },
    {
      name: "partiesAllowed" as const,
      label: "Parties Allowed",
      icon: Music,
    },
    {
      name: "quietHours" as const,
      label: "Quiet Hours Enforced",
      icon: Volume2,
    },
    {
      name: "maintenanceResponsibility" as const,
      label: "Tenant Maintenance",
      icon: Wrench,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policies</CardTitle>
        <CardDescription>Set property policies and rules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {policies.map((policy) => {
            const Icon = policy.icon;
            return (
              <FormField
                key={policy.name}
                control={form.control}
                name={policy.name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel
                      htmlFor={`policy-${policy.name}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      {policy.label}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        id={`policy-${policy.name}`}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Step 8: Contact & Viewing
function ContactStep({
  form,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
}) {
  const watchedContactMethod = form.watch("preferredContactMethod");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Viewing</CardTitle>
        <CardDescription>
          How can interested parties contact you?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Preferred Contact Method - Tabbed UI */}
        <FormField
          control={form.control}
          name="preferredContactMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Contact Method *</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "phone",
                      label: "Phone",
                      icon: Phone,
                      color: "text-blue-600",
                      bgColor: "bg-blue-50 dark:bg-blue-950/20",
                      borderColor: "border-blue-200 dark:border-blue-800",
                    },
                    {
                      value: "email",
                      label: "Email",
                      icon: Mail,
                      color: "text-green-600",
                      bgColor: "bg-green-50 dark:bg-green-950/20",
                      borderColor: "border-green-200 dark:border-green-800",
                    },
                    {
                      value: "both",
                      label: "Both",
                      icon: PhoneCall,
                      color: "text-purple-600",
                      bgColor: "bg-purple-50 dark:bg-purple-950/20",
                      borderColor: "border-purple-200 dark:border-purple-800",
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isSelected = field.value === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? `${option.borderColor} ${option.bgColor} border-2 shadow-md`
                            : "border-border bg-muted/30 hover:bg-muted/50"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSelected && (
                          <motion.div
                            className={`absolute inset-0 rounded-lg ${option.bgColor}`}
                            layoutId="contactMethodBg"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <Icon
                            className={`h-6 w-6 ${
                              isSelected ? option.color : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional Phone Field */}
        {(watchedContactMethod === "phone" || watchedContactMethod === "both") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FormField
              control={form.control}
              name="contactInfo.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        )}

        {/* Conditional Email Field */}
        {(watchedContactMethod === "email" || watchedContactMethod === "both") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FormField
              control={form.control}
              name="contactInfo.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="your@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
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
                  placeholder="Optional: e.g., Weekdays 9am-5pm, Weekends by appointment"
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

// Step 9: Photos & Media
function PhotosStep({
  form,
  watchedImages,
  pendingImages,
  isUploading,
  onFileSelect,
  onDeleteImage,
  onDeletePendingImage,
}: {
  form: ReturnType<typeof useForm<PropertyFormData>>;
  watchedImages: Image[];
  pendingImages: Array<{ file: File; preview: string }>;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onDeleteImage: (image: Image, index: number) => void;
  onDeletePendingImage: (index: number) => void;
}) {
  const totalImages = watchedImages.length + pendingImages.length;
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
                      Add Image
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
                        // Reset input so same file can be selected again
                        e.target.value = "";
                      }}
                      disabled={isUploading}
                    />
                  </div>

                  {totalImages > 0 && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {/* Show uploaded images */}
                      {watchedImages.map((image, index) => (
                        <div key={`uploaded-${index}`} className="relative group">
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

                      {/* Show pending images (to be uploaded on submit) */}
                      {pendingImages.map(({ preview }, index) => (
                        <div key={`pending-${index}`} className="relative group">
                          <img
                            src={preview}
                            alt={`Pending ${index + 1}`}
                            className="h-48 w-full rounded-md object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                            Pending
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onDeletePendingImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalImages === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No images added yet. At least one image is required. Images will be uploaded when you click Submit.
                    </p>
                  )}

                  {pendingImages.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {pendingImages.length} image(s) pending upload. They will be uploaded when you click Submit.
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
                  placeholder="Optional: https://youtube.com/watch?v=..."
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
