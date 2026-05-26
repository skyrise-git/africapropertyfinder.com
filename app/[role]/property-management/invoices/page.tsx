"use client";

import { Plus, Receipt, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Invoice,
  InvoiceInput,
  InvoiceKind,
  Lease,
  Tenant,
} from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";
import { leaseLabelFromMaps } from "@/lib/utils/pm-labels";

const statusVariant: Record<
  Invoice["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  sent: "secondary",
  partial: "secondary",
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
};

export default function InvoicesPage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const ownerId = role === "agent" ? user?.uid : undefined;

  const router = useRouter();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    leaseId: string;
    kind: InvoiceKind;
    period_start: string;
    period_end: string;
    issue_date: string;
    due_date: string;
    amount: number;
    tax: number;
    notes: string;
  }>({
    leaseId: "",
    kind: "rent",
    period_start: "",
    period_end: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
    amount: 0,
    tax: 0,
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, lea, ten] = await Promise.all([
        invoiceService.getAll(ownerId),
        leaseService.getAll(ownerId),
        tenantService.getAll(ownerId),
      ]);
      const propIds = Array.from(new Set(lea.map((l) => l.propertyId)));
      const props = await Promise.all(
        propIds.map((id) => propertyService.getById(id)),
      );
      setRows(inv);
      setLeases(lea);
      setTenants(ten);
      setProperties(props.filter(Boolean) as Property[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  const tenantMap = useMemo(
    () => Object.fromEntries(tenants.map((t) => [t.id, t])),
    [tenants],
  );
  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p])),
    [properties],
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!t) return true;
      return (
        r.invoice_number.toLowerCase().includes(t) ||
        r.kind.toLowerCase().includes(t)
      );
    });
  }, [rows, search, statusFilter]);

  function openNew() {
    setForm({
      leaseId: leases[0]?.id ?? "",
      kind: "rent",
      period_start: "",
      period_end: "",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      amount: leases[0]?.rent_amount ? Number(leases[0].rent_amount) : 0,
      tax: 0,
      notes: "",
    });
    setOpen(true);
  }

  async function generateNext(leaseId: string) {
    try {
      const id = await invoiceService.generateNextRent(leaseId);
      toast.success("Rent invoice generated", {
        action: {
          label: "View invoice",
          onClick: () =>
            router.push(`/${role}/property-management/invoices/${id}`),
        },
      });
      load();
      return id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    }
  }

  async function save() {
    if (!form.leaseId || !form.amount || !form.due_date) {
      toast.error("Lease, amount and due date are required");
      return;
    }
    const lease = leases.find((l) => l.id === form.leaseId);
    if (!lease) {
      toast.error("Lease not found");
      return;
    }
    setSaving(true);
    try {
      const total = Number(form.amount) + Number(form.tax || 0);
      const payload: InvoiceInput = {
        ownerId: user?.uid,
        leaseId: form.leaseId,
        tenantId: lease.tenantId,
        propertyId: lease.propertyId,
        kind: form.kind,
        period_start: form.period_start || undefined,
        period_end: form.period_end || undefined,
        issue_date: form.issue_date,
        due_date: form.due_date,
        amount: Number(form.amount),
        tax: Number(form.tax || 0),
        total,
        currency: lease.currency,
        notes: form.notes,
        status: "draft",
      };
      const newId = await invoiceService.create(payload);
      toast.success("Invoice created", {
        action: {
          label: "View invoice",
          onClick: () =>
            router.push(`/${role}/property-management/invoices/${newId}`),
        },
      });
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
      await invoiceService.delete(deleteId);
      toast.success("Invoice deleted");
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            <div>
              <CardTitle className="font-light tracking-tight">
                Invoices
              </CardTitle>
              <CardDescription>
                Send rent invoices and track outstanding balances.
              </CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-2 size-4" />
            New invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by invoice #, kind…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No invoices.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/${role}/property-management/invoices/${inv.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {inv.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize">
                        {inv.kind.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.period_start ?? "—"} → {inv.period_end ?? "—"}
                      </TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(inv.total), inv.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[inv.status]}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/${role}/property-management/invoices/${inv.id}`}
                            >
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(inv.id)}
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

        {leases.length > 0 ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">Quick action: </span>
            <Select onValueChange={(v) => generateNext(v)}>
              <SelectTrigger className="ml-2 inline-flex h-8 w-auto min-w-[260px]">
                <SelectValue placeholder="Generate next rent invoice for…" />
              </SelectTrigger>
              <SelectContent>
                {leases.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {leaseLabelFromMaps(l, propertyMap, tenantMap)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>
              Issue a charge against a lease.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="lease">Lease *</Label>
              <Select
                value={form.leaseId}
                onValueChange={(v) =>
                  setForm((f) => {
                    const l = leases.find((x) => x.id === v);
                    return {
                      ...f,
                      leaseId: v,
                      amount: l ? Number(l.rent_amount) : f.amount,
                    };
                  })
                }
              >
                <SelectTrigger id="lease">
                  <SelectValue placeholder="Select lease" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {leaseLabelFromMaps(l, propertyMap, tenantMap)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="kind">Kind</Label>
              <Select
                value={form.kind}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, kind: v as InvoiceKind }))
                }
              >
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="late_fee">Late fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due">Due date *</Label>
              <Input
                id="due"
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="period_start">Period start</Label>
              <Input
                id="period_start"
                type="date"
                value={form.period_start}
                onChange={(e) =>
                  setForm((f) => ({ ...f, period_start: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="period_end">Period end</Label>
              <Input
                id="period_end"
                type="date"
                value={form.period_end}
                onChange={(e) =>
                  setForm((f) => ({ ...f, period_end: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="amt">Amount *</Label>
              <Input
                id="amt"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label htmlFor="tax">Tax</Label>
              <Input
                id="tax"
                type="number"
                min={0}
                step="0.01"
                value={form.tax}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tax: Number(e.target.value) }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Linked payments will be detached. This cannot be undone.
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
