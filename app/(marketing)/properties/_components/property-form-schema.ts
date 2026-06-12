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
const propertyFormSchema = z.discriminatedUnion("listingType", [
  saleSchema,
  rentSchema,
  studentHousingSchema,
]);

// --- Validation helpers (pure, low complexity) ---

function validateSharedDetails(data: any, ctx: z.RefinementCtx): void {
  // Only applies to rent or student-housing with isShared === true
  const isRelevant =
    (data.listingType === "rent" || data.listingType === "student-housing") &&
    data.isShared === true;

  if (!isRelevant) return;

  if (!data.sharingDetails) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Sharing details are required when property is shared",
      path: ["sharingDetails"],
    });
    return;
  }

  const details = data.sharingDetails;
  if (!details.sharingType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Sharing type is required",
      path: ["sharingDetails", "sharingType"],
    });
  }
  if (details.currentOccupants === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Current occupants is required",
      path: ["sharingDetails", "currentOccupants"],
    });
  }
  if (!details.preferredTenantType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preferred tenant type is required",
      path: ["sharingDetails", "preferredTenantType"],
    });
  }
}

function validateContactInfo(data: any, ctx: z.RefinementCtx): void {
  const method = data.preferredContactMethod;

  // Phone required if method is 'phone' or 'both'
  if (method === "phone" || method === "both") {
    const phone = data.contactInfo?.phone;
    if (!phone || phone.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required",
        path: ["contactInfo", "phone"],
      });
    }
  }

  // Email required if method is 'email' or 'both'
  if (method === "email" || method === "both") {
    const email = data.contactInfo?.email;
    if (!email || email.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email address is required",
        path: ["contactInfo", "email"],
      });
    } else if (!z.string().email().safeParse(email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid email address",
        path: ["contactInfo", "email"],
      });
    }
  }
}

// --- Final refined schema ---
export const refinedPropertyFormSchema = propertyFormSchema.superRefine((data, ctx) => {
  validateSharedDetails(data, ctx);
  validateContactInfo(data, ctx);
});

export type PropertyFormData = z.infer<typeof refinedPropertyFormSchema>;