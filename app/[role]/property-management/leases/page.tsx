"use client";

import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/hooks/use-app-store";
import { propertyService } from "@/lib/services/property.service";
import {
  invoiceService,
  leaseService,
  tenantService,
} from "@/lib/services/property-management.service";
import type { Property } from "@/lib/types/property.type";
import type {
  Lease,
  LeaseInput,
  LeasePaymentFrequency,
  LeaseStatus,
  Tenant,
} from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";

const emptyLease: LeaseInput = {
  propertyId: "",
  tenantId: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  rent_amount: 0,
  deposit_amount: 0,
  currency: "ZAR",
  payment_frequency: "monthly",
  payment_day: 1,
  late_fee_amount: 0,
  grace_period_days: 5,
  notes: "",
  status: "active",
  fee_bearer: "owner",
  fee_basis_points: 50,
};

export default function LeasesPage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const ownerId = role === "agent" ? user?.uid : undefined;

  const [rows, setRows] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);
  const [form, setForm] = useState<LeaseInput>(emptyLease);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, t] = await Promise.all([
        leaseService.getAll(ownerId),
        tenantService.getAll(ownerId),
      ]);
      const allProperties = ownerId
        ? await propertyService.getByUserId(ownerId)
        : await propertyService.getAll();
      setRows(l);
      setTenants(t);
      setProperties(allProperties);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const tenantMap = useMemo(
    () => Object.fromEntries(tenants.map((t) => [t.id, t.name])),
    [tenants],
  );
  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties],
  );

  function openNew() {
    setEditing(null);
    setForm(emptyLease);
    setOpen(true);
  }

  function openEdit(l: Lease) {
    setEditing(l);
    setForm({
      propertyId: l.propertyId,
      tenantId: l.tenantId,
      start_date: l.start_date,
      end_date: l.end_date ?? "",
      rent_amount: Number(l.rent_amount),
      deposit_amount: Number(l.deposit_amount ?? 0),
      currency: l.currency,
      payment_frequency: l.payment_frequency,
      payment_day: l.payment_day,
      late_fee_amount: Number(l.late_fee_amount ?? 0),
      grace_period_days: l.grace_period_days,
      notes: l.notes ?? "",
      status: l.status,
      fee_bearer: l.fee_bearer ?? "owner",
      fee_basis_points: l.fee_basis_points ?? 50,
    });
    setOpen(true);
  }

  async function save() {
    if (
      !form.propertyId ||
      !form.tenantId ||
      !form.start_date ||
      !form.rent_amount
    ) {
      toast.error("Property, tenant, start date and rent amount are required");
      return;
    }
    setSaving(true);
    try {
      const payload: LeaseInput = {
        ...form,
        end_date: form.end_date || undefined,
        ownerId: user?.uid,
      };
      if (editing) {
        await leaseService.update(editing.id, payload);
        toast.success("Lease updated");
      } else {
        await leaseService.create(payload);
        toast.success("Lease created");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await leaseService.delete(deleteId);
      toast.success("Lease deleted");
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  async function generateInvoice(l: Lease) {
    try {
      await invoiceService.generateNextRent(l.id);
      toast.success("Rent invoice generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <div>
              <CardTitle className="font-light tracking-tight">
                Leases
              </CardTitle>
              <CardDescription>
                Link a tenant to a property and track tenancy details.
              </CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-2 size-4" />
            New lease
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Rent</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No leases yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {propertyMap[l.propertyId] ?? "—"}
                      </TableCell>
                      <TableCell>{tenantMap[l.tenantId] ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.start_date} → {l.end_date ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(l.rent_amount), l.currency)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {l.payment_frequency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            l.status === "active" ? "default" : "secondary"
                          }
                        >
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateInvoice(l)}
                          >
                            Generate invoice
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(l)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(l.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit lease" : "New lease"}</DialogTitle>
            <DialogDescription>
              Tenancy terms used to generate rent invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="propertyId">Property *</Label>
              <Select
                value={form.propertyId}
                onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v }))}
              >
                <SelectTrigger id="propertyId">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      No properties available
                    </SelectItem>
                  ) : (
                    properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tenantId">Tenant *</Label>
              <Select
                value={form.tenantId}
                onValueChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
              >
                <SelectTrigger id="tenantId">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      No tenants — add one first
                    </SelectItem>
                  ) : (
                    tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Start date *</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="end_date">End date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="rent">Rent amount *</Label>
              <Input
                id="rent"
                type="number"
                min="0"
                step="0.01"
                value={form.rent_amount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rent_amount: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="deposit">Deposit</Label>
              <Input
                id="deposit"
                type="number"
                min="0"
                step="0.01"
                value={form.deposit_amount ?? 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    deposit_amount: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.currency ?? "ZAR"}
                onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZAR">ZAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZWL">ZWL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="freq">Frequency</Label>
              <Select
                value={form.payment_frequency ?? "monthly"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    payment_frequency: v as LeasePaymentFrequency,
                  }))
                }
              >
                <SelectTrigger id="freq">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pay_day">Payment day (1-31)</Label>
              <Input
                id="pay_day"
                type="number"
                min={1}
                max={31}
                value={form.payment_day ?? 1}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_day: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="grace">Grace period (days)</Label>
              <Input
                id="grace"
                type="number"
                min={0}
                value={form.grace_period_days ?? 5}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    grace_period_days: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="late_fee">Late fee</Label>
              <Input
                id="late_fee"
                type="number"
                min={0}
                step="0.01"
                value={form.late_fee_amount ?? 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    late_fee_amount: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status ?? "active"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as LeaseStatus }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fee_bearer">Platform fee paid by</Label>
              <Select
                value={form.fee_bearer ?? "owner"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    fee_bearer: v as "owner" | "tenant",
                  }))
                }
              >
                <SelectTrigger id="fee_bearer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">
                    Owner (deducted from rent net)
                  </SelectItem>
                  <SelectItem value="tenant">
                    Tenant (added as separate line)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fee_bp">Platform fee (basis points)</Label>
              <Input
                id="fee_bp"
                type="number"
                min={0}
                max={1000}
                value={form.fee_basis_points ?? 50}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fee_basis_points: Number(e.target.value),
                  }))
                }
              />
              <p className="mt-1 text-muted-foreground text-xs">
                Default 50 bps = 0.5% of rent.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create lease"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lease?</AlertDialogTitle>
            <AlertDialogDescription>
              All associated invoices and payments will be removed too.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
