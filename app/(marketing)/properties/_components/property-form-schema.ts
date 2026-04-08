import { z } from "zod";

// Base location schema
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().optional(),
});

// Base image schema
const imageSchema = z.object({
  url: z.string().url(),
  path: z.string(),
  fileKey: z.string(),
});

// Base schema with common fields
const basePropertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  propertyType: z.enum([
    "apartment",
    "house",
    "condo",
    "townhouse",
    "studio",
    "room",
    "other",
  ]),
  numBedrooms: z.number().int().min(0),
  numBathrooms: z.number().int().min(0),
  furnishing: z.enum(["furnished", "semi-furnished", "unfurnished"]),
  area: z.number().positive("Area must be positive").optional(),
  floorNumber: z.number().int().min(0).optional(),
  totalFloors: z.number().int().min(0).optional(),
  country: z.string().min(1, "Country is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().optional(),
  nearbyTransit: z.string().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .refine(
      (loc) => !(loc.latitude === 0 && loc.longitude === 0),
      "Location selection is required",
    ),
  parkingAvailable: z.boolean().optional(),
  laundry: z.boolean().optional(),
  heatingCooling: z.boolean().optional(),
  balcony: z.boolean().optional(),
  wifi: z.boolean().optional(),
  gym: z.boolean().optional(),
  pool: z.boolean().optional(),
  elevator: z.boolean().optional(),
  security: z.boolean().optional(),
  garden: z.boolean().optional(),
  dishwasher: z.boolean().optional(),
  fireplace: z.boolean().optional(),
  otherAmenities: z.string().optional(),
  smokingAllowed: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  guestsAllowed: z.boolean().optional(),
  sublettingAllowed: z.boolean().optional(),
  partiesAllowed: z.boolean().optional(),
  quietHours: z.boolean().optional(),
  maintenanceResponsibility: z.boolean().optional(),
  contactName: z.string().min(1, "Contact name is required"),
  preferredContactMethod: z.enum(["phone", "email", "both"]),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
  viewingAvailability: z.string().optional(),
  images: z.array(imageSchema).min(1, "At least one image is required"),
  videoTourUrl: z.string().url().optional().or(z.literal("")),
});

// Sale schema
const saleSchema = basePropertySchema.extend({
  listingType: z.literal("sale"),
  price: z.number().positive("Price must be positive"),
});

// Rent schema
const rentSchema = basePropertySchema.extend({
  listingType: z.literal("rent"),
  rent: z.number().positive("Rent must be positive"),
  securityDeposit: z.number().min(0).optional(),
  leaseLength: z.number().int().positive("Lease length must be positive"),
  availableFrom: z.string().min(1, "Available from date is required"),
  paymentFrequency: z.enum(["monthly", "weekly", "yearly"]),
  utilitiesIncluded: z.boolean().optional(),
  isShared: z.boolean().optional(),
  sharingDetails: z
    .object({
      sharingType: z.enum(["room", "apartment", "house"]).optional(),
      currentOccupants: z.number().int().min(0).optional(),
      preferredTenantType: z.enum([
        "students",
        "professionals",
        "families",
        "anyone",
      ]).optional(),
    })
    .optional(),
});

// Student housing schema (same as rent)
const studentHousingSchema = basePropertySchema.extend({
  listingType: z.literal("student-housing"),
  rent: z.number().positive("Rent must be positive"),
  securityDeposit: z.number().min(0).optional(),
  leaseLength: z.number().int().positive("Lease length must be positive"),
  availableFrom: z.string().min(1, "Available from date is required"),
  paymentFrequency: z.enum(["monthly", "weekly", "yearly"]),
  utilitiesIncluded: z.boolean().optional(),
  isShared: z.boolean().optional(),
  sharingDetails: z
    .object({
      sharingType: z.enum(["room", "apartment", "house"]).optional(),
      currentOccupants: z.number().int().min(0).optional(),
      preferredTenantType: z.enum([
        "students",
        "professionals",
        "families",
        "anyone",
      ]).optional(),
    })
    .optional(),
});

// Conditional schema based on listingType
export const propertyFormSchema = z.discriminatedUnion("listingType", [
  saleSchema,
  rentSchema,
  studentHousingSchema,
]);

// Refinement for shared property details and contact info
export const refinedPropertyFormSchema = propertyFormSchema.superRefine(
  (data, ctx) => {
    // Shared property validation
    if (
      (data.listingType === "rent" || data.listingType === "student-housing") &&
      data.isShared === true
    ) {
      if (!data.sharingDetails) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sharing details are required when property is shared",
          path: ["sharingDetails"],
        });
      } else {
        if (!data.sharingDetails.sharingType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Sharing type is required",
            path: ["sharingDetails", "sharingType"],
          });
        }
        if (data.sharingDetails.currentOccupants === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Current occupants is required",
            path: ["sharingDetails", "currentOccupants"],
          });
        }
        if (!data.sharingDetails.preferredTenantType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Preferred tenant type is required",
            path: ["sharingDetails", "preferredTenantType"],
          });
        }
      }
    }

    // Contact info validation based on preferred method
    if (data.preferredContactMethod === "phone" || data.preferredContactMethod === "both") {
      if (!data.contactInfo.phone || data.contactInfo.phone.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required",
          path: ["contactInfo", "phone"],
        });
      }
    }
    if (data.preferredContactMethod === "email" || data.preferredContactMethod === "both") {
      if (!data.contactInfo.email || data.contactInfo.email.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email address is required",
          path: ["contactInfo", "email"],
        });
      } else if (!z.string().email().safeParse(data.contactInfo.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid email address",
          path: ["contactInfo", "email"],
        });
      }
    }
  },
);

export type PropertyFormData = z.infer<typeof refinedPropertyFormSchema>;

