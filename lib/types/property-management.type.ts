import type { BaseEntity } from "./common.type";

// =========================================================================
// Tenants
// =========================================================================
export type TenantStatus = "active" | "inactive" | "archived";

export interface Tenant extends BaseEntity {
  ownerId?: string;
  name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  status: TenantStatus;
  /** Phase 4: tenant account linkage */
  linked_user_id?: string;
  invite_token?: string;
  invite_sent_at?: string;
  invite_accepted_at?: string;
}

export interface TenantInput {
  ownerId?: string;
  name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  status?: TenantStatus;
}

export type TenantUpdateInput = Partial<TenantInput>;

// =========================================================================
// Leases
// =========================================================================
export type LeasePaymentFrequency = "monthly" | "weekly" | "yearly";
export type LeaseStatus = "active" | "pending" | "ended" | "terminated";

export type FeeBearer = "owner" | "tenant";

export interface Lease extends BaseEntity {
  ownerId?: string;
  propertyId: string;
  tenantId: string;
  start_date: string;
  end_date?: string;
  rent_amount: number;
  deposit_amount: number;
  currency: string;
  payment_frequency: LeasePaymentFrequency;
  payment_day: number;
  late_fee_amount?: number;
  grace_period_days: number;
  notes?: string;
  status: LeaseStatus;
  /** Phase 9 fee policy */
  fee_bearer?: FeeBearer;
  fee_basis_points?: number;
}

export interface LeaseInput {
  ownerId?: string;
  propertyId: string;
  tenantId: string;
  start_date: string;
  end_date?: string;
  rent_amount: number;
  deposit_amount?: number;
  currency?: string;
  payment_frequency?: LeasePaymentFrequency;
  payment_day?: number;
  late_fee_amount?: number;
  grace_period_days?: number;
  notes?: string;
  status?: LeaseStatus;
  fee_bearer?: FeeBearer;
  fee_basis_points?: number;
}

export type LeaseUpdateInput = Partial<LeaseInput>;

// =========================================================================
// Invoices
// =========================================================================
export type InvoiceKind = "rent" | "deposit" | "utility" | "late_fee" | "other";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";

export interface Invoice extends BaseEntity {
  ownerId?: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  invoice_number: string;
  kind: InvoiceKind;
  period_start?: string;
  period_end?: string;
  issue_date: string;
  due_date: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  status: InvoiceStatus;
  sent_at?: string;
  /** Phase 9 fee snapshot (immutable once issued) */
  platform_fee_amount?: number;
  platform_fee_bearer?: FeeBearer;
  platform_fee_basis_points?: number;
  owner_net_amount?: number;
}

export interface InvoiceInput {
  ownerId?: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  kind?: InvoiceKind;
  period_start?: string;
  period_end?: string;
  issue_date?: string;
  due_date: string;
  amount: number;
  tax?: number;
  total?: number;
  currency?: string;
  notes?: string;
  status?: InvoiceStatus;
}

export type InvoiceUpdateInput = Partial<InvoiceInput> & {
  sent_at?: string;
};

// =========================================================================
// Payments
// =========================================================================
export type PaymentMethod =
  | "cash"
  | "eft"
  | "card"
  | "mobile_money"
  | "cheque"
  | "other";

export interface Payment extends BaseEntity {
  ownerId?: string;
  invoiceId?: string;
  leaseId?: string;
  tenantId?: string;
  propertyId?: string;
  receipt_number: string;
  paid_on: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentInput {
  ownerId?: string;
  invoiceId?: string;
  leaseId?: string;
  tenantId?: string;
  propertyId?: string;
  paid_on?: string;
  amount: number;
  currency?: string;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export type PaymentUpdateInput = Partial<PaymentInput>;

// =========================================================================
// Expenses
// =========================================================================
export type ExpenseCategory =
  | "maintenance"
  | "utilities"
  | "rates"
  | "levies"
  | "insurance"
  | "management_fee"
  | "other";

export interface Expense extends BaseEntity {
  ownerId?: string;
  propertyId: string;
  leaseId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  spent_on: string;
  vendor?: string;
  receipt_url?: string;
}

export interface ExpenseInput {
  ownerId?: string;
  propertyId: string;
  leaseId?: string;
  category?: ExpenseCategory;
  description: string;
  amount: number;
  currency?: string;
  spent_on?: string;
  vendor?: string;
  receipt_url?: string;
}

export type ExpenseUpdateInput = Partial<ExpenseInput>;

// =========================================================================
// Maintenance requests
// =========================================================================
export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "cancelled";

export interface MaintenanceRequest extends BaseEntity {
  ownerId?: string;
  propertyId: string;
  tenantId?: string;
  leaseId?: string;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reported_on: string;
  resolved_on?: string;
  cost?: number;
  vendor?: string;
}

export interface MaintenanceRequestInput {
  ownerId?: string;
  propertyId: string;
  tenantId?: string;
  leaseId?: string;
  title: string;
  description?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  reported_on?: string;
  resolved_on?: string;
  cost?: number;
  vendor?: string;
}

export type MaintenanceRequestUpdateInput = Partial<MaintenanceRequestInput>;

// =========================================================================
// Reminders
// =========================================================================
export type ReminderKind =
  | "rent_due"
  | "invoice_overdue"
  | "lease_expiring"
  | "custom";

export type ReminderChannel = "email" | "sms" | "in_app";

export type ReminderStatus =
  | "scheduled"
  | "sent"
  | "failed"
  | "cancelled"
  | "acknowledged";

export interface Reminder extends BaseEntity {
  ownerId?: string;
  kind: ReminderKind;
  leaseId?: string;
  invoiceId?: string;
  tenantId?: string;
  title: string;
  message?: string;
  remind_at: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  sent_at?: string;
}

export interface ReminderInput {
  ownerId?: string;
  kind: ReminderKind;
  leaseId?: string;
  invoiceId?: string;
  tenantId?: string;
  title: string;
  message?: string;
  remind_at: string;
  channel?: ReminderChannel;
  status?: ReminderStatus;
}

export type ReminderUpdateInput = Partial<ReminderInput> & {
  sent_at?: string;
};

// =========================================================================
// Outbound messages log
// =========================================================================
export type MessageKind =
  | "invoice"
  | "receipt"
  | "reminder"
  | "lease_notice"
  | "custom";

export type MessageChannel = "email" | "sms" | "in_app";
export type MessageStatus = "queued" | "sent" | "failed";

export interface PmMessage {
  id: string;
  ownerId?: string;
  tenantId?: string;
  invoiceId?: string;
  paymentId?: string;
  kind: MessageKind;
  channel: MessageChannel;
  recipient: string;
  subject?: string;
  body?: string;
  status: MessageStatus;
  createdAt: string;
  sent_at?: string;
  error?: string;
  attempt_count?: number;
  last_attempted_at?: string;
}

export interface PmMessageInput {
  ownerId?: string;
  tenantId?: string;
  invoiceId?: string;
  paymentId?: string;
  kind: MessageKind;
  channel?: MessageChannel;
  recipient: string;
  subject?: string;
  body?: string;
  status?: MessageStatus;
}
