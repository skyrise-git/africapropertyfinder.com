import type { BaseEntity } from "./common.type";

export type ContactStatus = "new" | "read" | "replied" | "archived";

export interface Contact extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  repliedAt?: string;
  repliedBy?: string;
}

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactUpdateInput {
  status?: ContactStatus;
  repliedAt?: string;
  repliedBy?: string;
}

