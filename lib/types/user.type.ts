import type { BaseEntity } from "./common.type";

// Status types
export type Status = "active" | "inactive";
export type UserStatus = "active" | "inactive" | "pending";
export type UserRole = "admin" | "staff" | "agent" | "user";

export interface UserCapabilities {
  canList: boolean;
  canBuy: boolean;
  canManageProperty: boolean;
  canLeaseAsTenant: boolean;
}

export type CapabilityName = keyof UserCapabilities;

export const DEFAULT_CAPABILITIES: UserCapabilities = {
  canList: false,
  canBuy: true,
  canManageProperty: false,
  canLeaseAsTenant: false,
};

export interface User extends BaseEntity {
  uid: string;
  name: string;
  email: string;
  status: UserStatus;
  password: string;
  role: UserRole;
  profilePicture?: string;
  profilePictureFileKey?: string;
  capabilities?: UserCapabilities;
}

// Input types for user creation
export interface UserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  status?: UserStatus;
  profilePicture?: string;
  profilePictureFileKey?: string;
}

export interface EmailSubscriberRow {
  id: string;
  email: string;
  agent_id: string | null;
  verified: boolean;
  createdAt: string;
}

export interface NeighborhoodGuideContent {
  schools?: Array<{ name?: string; type?: string; distance?: string }>;
  transport?: Array<{ name?: string; type?: string; distance?: string }>;
  healthcare?: Array<{ name?: string; type?: string }>;
  lifestyle?: string;
  safety_summary?: string;
}
