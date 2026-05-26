import { createClient } from "@/lib/supabase/client";
import type {
  Expense,
  ExpenseInput,
  ExpenseUpdateInput,
  Invoice,
  InvoiceInput,
  InvoiceUpdateInput,
  Lease,
  LeaseInput,
  LeaseUpdateInput,
  MaintenanceRequest,
  MaintenanceRequestInput,
  MaintenanceRequestUpdateInput,
  Payment,
  PaymentInput,
  PaymentUpdateInput,
  PmMessage,
  PmMessageInput,
  Reminder,
  ReminderInput,
  ReminderUpdateInput,
  Tenant,
  TenantInput,
  TenantUpdateInput,
} from "@/lib/types/property-management.type";

// All services here go through the same Supabase RLS-protected tables.
// Owner scoping is automatic: only rows where `ownerId = auth.uid()` are
// returned for non-admin users (admins/staff see all). Inputs will set
// `ownerId` from the calling component when creating new rows.

class TenantService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: TenantInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("pm_tenants")
      .insert({
        status: "active",
        ...data,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<Tenant[]> {
    let q = this.db
      .from("pm_tenants")
      .select("*")
      .order("createdAt", { ascending: false });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Tenant[];
  }

  async getById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.db
      .from("pm_tenants")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as unknown as Tenant;
  }

  async update(id: string, data: TenantUpdateInput): Promise<void> {
    if (!id) throw new Error("Tenant ID is required");
    const { error } = await this.db
      .from("pm_tenants")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  /**
   * Archive a tenant instead of deleting; the DB trigger blocks hard delete
   * when an active or pending lease still references the tenant. This call
   * tries hard delete first and gracefully falls back to archiving when the
   * tenant is referenced.
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("pm_tenants").delete().eq("id", id);
    if (!error) return;
    const msg = error.message?.toLowerCase() ?? "";
    if (
      msg.includes("active") ||
      msg.includes("pending") ||
      msg.includes("23503")
    ) {
      await this.update(id, { status: "archived" });
      return;
    }
    throw new Error(error.message);
  }

  async archive(id: string): Promise<void> {
    await this.update(id, { status: "archived" });
  }

  /** Issue an invite token for a tenant (RPC enforces ownership). */
  async issueInvite(tenantId: string): Promise<string> {
    const { data, error } = await this.db.rpc("pm_issue_tenant_invite", {
      p_tenant: tenantId,
    });
    if (error) throw new Error(error.message);
    return data as string;
  }

  /** Accept an invite token while signed in as the tenant user. */
  async acceptInvite(token: string): Promise<string> {
    const { data, error } = await this.db.rpc("pm_accept_tenant_invite", {
      p_token: token,
    });
    if (error) throw new Error(error.message);
    return data as string;
  }
}

class LeaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: LeaseInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("pm_leases")
      .insert({
        deposit_amount: 0,
        currency: "ZAR",
        payment_frequency: "monthly",
        payment_day: 1,
        grace_period_days: 5,
        status: "active",
        ...data,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<Lease[]> {
    let q = this.db
      .from("pm_leases")
      .select("*")
      .order("createdAt", { ascending: false });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Lease[];
  }

  async getById(id: string): Promise<Lease | null> {
    const { data, error } = await this.db
      .from("pm_leases")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as unknown as Lease;
  }

  async getByPropertyId(propertyId: string): Promise<Lease[]> {
    const { data, error } = await this.db
      .from("pm_leases")
      .select("*")
      .eq("propertyId", propertyId)
      .order("createdAt", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Lease[];
  }

  async update(id: string, data: LeaseUpdateInput): Promise<void> {
    if (!id) throw new Error("Lease ID is required");
    const { error } = await this.db
      .from("pm_leases")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("pm_leases").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

class InvoiceService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: InvoiceInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const total =
      data.total ?? Number(data.amount ?? 0) + Number(data.tax ?? 0);
    const { data: row, error } = await this.db
      .from("pm_invoices")
      .insert({
        kind: "rent",
        currency: "ZAR",
        tax: 0,
        status: "draft",
        issue_date: new Date().toISOString().slice(0, 10),
        ...data,
        invoice_number: "",
        total,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<Invoice[]> {
    let q = this.db
      .from("pm_invoices")
      .select("*")
      .order("createdAt", { ascending: false });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Invoice[];
  }

  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.db
      .from("pm_invoices")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as unknown as Invoice;
  }

  async getByLeaseId(leaseId: string): Promise<Invoice[]> {
    const { data, error } = await this.db
      .from("pm_invoices")
      .select("*")
      .eq("leaseId", leaseId)
      .order("createdAt", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Invoice[];
  }

  async update(id: string, data: InvoiceUpdateInput): Promise<void> {
    if (!id) throw new Error("Invoice ID is required");
    const { error } = await this.db
      .from("pm_invoices")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async markSent(id: string): Promise<void> {
    const nowISO = new Date().toISOString();
    const { error } = await this.db
      .from("pm_invoices")
      .update({ status: "sent", sent_at: nowISO, updatedAt: nowISO })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async cancel(id: string): Promise<void> {
    const { error } = await this.db
      .from("pm_invoices")
      .update({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("pm_invoices").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** Generate the next rent invoice for a lease using the SQL helper. */
  async generateNextRent(leaseId: string): Promise<string> {
    const { data, error } = await this.db.rpc("pm_next_rent_invoice", {
      p_lease: leaseId,
    });
    if (error) throw new Error(error.message);
    return data as string;
  }
}

class PaymentService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: PaymentInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("pm_payments")
      .insert({
        currency: "ZAR",
        method: "eft",
        paid_on: new Date().toISOString().slice(0, 10),
        ...data,
        receipt_number: "",
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<Payment[]> {
    let q = this.db
      .from("pm_payments")
      .select("*")
      .order("paid_on", { ascending: false });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Payment[];
  }

  async getById(id: string): Promise<Payment | null> {
    const { data, error } = await this.db
      .from("pm_payments")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as unknown as Payment;
  }

  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await this.db
      .from("pm_payments")
      .select("*")
      .eq("invoiceId", invoiceId)
      .order("paid_on", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Payment[];
  }

  async update(id: string, data: PaymentUpdateInput): Promise<void> {
    if (!id) throw new Error("Payment ID is required");
    const { error } = await this.db
      .from("pm_payments")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("pm_payments").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

class ExpenseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: ExpenseInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("pm_expenses")
      .insert({
        category: "other",
        currency: "ZAR",
        spent_on: new Date().toISOString().slice(0, 10),
        ...data,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<Expense[]> {
    let q = this.db
      .from("pm_expenses")
      .select("*")
      .order("spent_on", { ascending: false });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Expense[];
  }

  async update(id: string, data: ExpenseUpdateInput): Promise<void> {
    const { error } = await this.db
      .from("pm_expenses")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("pm_expenses").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

class MaintenanceService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: MaintenanceRequestInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("pm_maintenance_requests")
      .insert({
        priority: "medium",
        status: "open",
        reported_on: new Date().toISOString().slice(0, 10),
        ...data,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<MaintenanceRequest[]> {
    let q = this.db
      .from("pm_maintenance_requests")
      .select("*")
      .order("createdAt", { ascending: false });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MaintenanceRequest[];
  }

  async update(id: string, data: MaintenanceRequestUpdateInput): Promise<void> {
    const { error } = await this.db
      .from("pm_maintenance_requests")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from("pm_maintenance_requests")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

class ReminderService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: ReminderInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("pm_reminders")
      .insert({
        channel: "email",
        status: "scheduled",
        ...data,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<Reminder[]> {
    let q = this.db
      .from("pm_reminders")
      .select("*")
      .order("remind_at", { ascending: true });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Reminder[];
  }

  async update(id: string, data: ReminderUpdateInput): Promise<void> {
    const { error } = await this.db
      .from("pm_reminders")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("pm_reminders").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async acknowledge(id: string): Promise<void> {
    await this.update(id, { status: "acknowledged" });
  }
}

class PmMessageService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async log(data: PmMessageInput): Promise<string> {
    const { data: row, error } = await this.db
      .from("pm_messages")
      .insert({
        channel: "email",
        status: "queued",
        ...data,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(ownerId?: string): Promise<PmMessage[]> {
    let q = this.db
      .from("pm_messages")
      .select("*")
      .order("createdAt", { ascending: false });
    if (ownerId) q = q.eq("ownerId", ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as PmMessage[];
  }
}

export const tenantService = new TenantService();
export const leaseService = new LeaseService();
export const invoiceService = new InvoiceService();
export const paymentService = new PaymentService();
export const expenseService = new ExpenseService();
export const maintenanceService = new MaintenanceService();
export const reminderService = new ReminderService();
export const pmMessageService = new PmMessageService();
