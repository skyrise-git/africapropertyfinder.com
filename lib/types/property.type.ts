import type { BaseEntity } from "./common.type";

export type ListingType = "sale" | "rent" | "student-housing";

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "townhouse"
  | "studio"
  | "room"
  | "other";

export type FurnishingType = "furnished" | "semi-furnished" | "unfurnished";

export type SharingType = "room" | "apartment" | "house";

export type PreferredTenantType =
  | "students"
  | "professionals"
  | "families"
  | "anyone";

export type PaymentFrequency = "monthly" | "weekly" | "yearly";

export type ContactMethod = "phone" | "email" | "both";

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface SharingDetails {
  sharingType?: SharingType;
  currentOccupants?: number;
  preferredTenantType?: PreferredTenantType;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
}

export interface Image {
  url: string;
  path: string;
  fileKey: string; // For deletion from UploadThing
}

export interface Property extends BaseEntity {
  // Basic Info
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  numBedrooms: number;
  numBathrooms: number;
  furnishing: FurnishingType;
  area?: number; // in square feet or square meters
  floorNumber?: number;
  totalFloors?: number;

  // Pricing
  price?: number; // For sale
  rent?: number; // For rent/student-housing
  securityDeposit?: number;
  leaseLength?: number; // in months
  availableFrom?: string; // ISO date string
  paymentFrequency?: PaymentFrequency;
  utilitiesIncluded?: boolean;

  // Shared Property
  isShared?: boolean;
  sharingDetails?: SharingDetails;

  // Amenities
  parkingAvailable?: boolean;
  laundry?: boolean;
  heatingCooling?: boolean;
  balcony?: boolean;
  wifi?: boolean;
  gym?: boolean;
  pool?: boolean;
  elevator?: boolean;
  security?: boolean;
  garden?: boolean;
  dishwasher?: boolean;
  fireplace?: boolean;
  otherAmenities?: string;

  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  nearbyTransit?: string;
  location: {
    latitude: number;
    longitude: number;
  };

  // Policies
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  guestsAllowed?: boolean;
  sublettingAllowed?: boolean;
  partiesAllowed?: boolean;
  quietHours?: boolean;
  maintenanceResponsibility?: boolean;

  // Contact & Viewing
  contactName: string;
  preferredContactMethod: ContactMethod[];
  contactInfo: ContactInfo;
  viewingAvailability?: string;

  // Photos & Media
  images: Image[];
  videoTourUrl?: string;
}

export interface PropertyInput {
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  numBedrooms: number;
  numBathrooms: number;
  furnishing: FurnishingType;
  area?: number;
  floorNumber?: number;
  totalFloors?: number;
  price?: number;
  rent?: number;
  securityDeposit?: number;
  leaseLength?: number;
  availableFrom?: string;
  paymentFrequency?: PaymentFrequency;
  utilitiesIncluded?: boolean;
  isShared?: boolean;
  sharingDetails?: SharingDetails;
  parkingAvailable?: boolean;
  laundry?: boolean;
  heatingCooling?: boolean;
  balcony?: boolean;
  wifi?: boolean;
  gym?: boolean;
  pool?: boolean;
  elevator?: boolean;
  security?: boolean;
  garden?: boolean;
  dishwasher?: boolean;
  fireplace?: boolean;
  otherAmenities?: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  nearbyTransit?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  guestsAllowed?: boolean;
  sublettingAllowed?: boolean;
  partiesAllowed?: boolean;
  quietHours?: boolean;
  maintenanceResponsibility?: boolean;
  contactName: string;
  preferredContactMethod: ContactMethod[];
  contactInfo: ContactInfo;
  viewingAvailability?: string;
  images: Image[];
  videoTourUrl?: string;
}

export interface PropertyUpdateInput {
  title?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  numBedrooms?: number;
  numBathrooms?: number;
  furnishing?: FurnishingType;
  area?: number;
  floorNumber?: number;
  totalFloors?: number;
  price?: number;
  rent?: number;
  securityDeposit?: number;
  leaseLength?: number;
  availableFrom?: string;
  paymentFrequency?: PaymentFrequency;
  utilitiesIncluded?: boolean;
  isShared?: boolean;
  sharingDetails?: SharingDetails;
  parkingAvailable?: boolean;
  laundry?: boolean;
  heatingCooling?: boolean;
  balcony?: boolean;
  wifi?: boolean;
  gym?: boolean;
  pool?: boolean;
  elevator?: boolean;
  security?: boolean;
  garden?: boolean;
  dishwasher?: boolean;
  fireplace?: boolean;
  otherAmenities?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  nearbyTransit?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  guestsAllowed?: boolean;
  sublettingAllowed?: boolean;
  partiesAllowed?: boolean;
  quietHours?: boolean;
  maintenanceResponsibility?: boolean;
  contactName?: string;
  preferredContactMethod?: ContactMethod[];
  contactInfo?: ContactInfo;
  viewingAvailability?: string;
  images?: Image[];
  videoTourUrl?: string;
}
