import type { BaseEntity } from "./common.type";

export interface SavedProperty extends BaseEntity {
  userId: string; // ID of the user who saved this property
  propertyId: string; // ID of the saved property
}

export interface SavedPropertyInput {
  userId: string;
  propertyId: string;
}

