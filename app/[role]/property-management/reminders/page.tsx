"use client";

import { Bell, CheckCircle2, Plus, Trash2 } from "lucide-react";
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
import {
  invoiceService,
  leaseService,
  reminderService,
  tenantService,
} from "@/lib/services/property-management.service";
import type {
  Invoice,
  Lease,
  Reminder,
  ReminderChannel,
  ReminderInput,
  ReminderKind,
  ReminderStatus,
  Tenant,
} from "@/lib/types/property-management.type";

const statusVariant: Record<
  ReminderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  scheduled: "secondary",
  sent: "default",
  failed: "destructive",
  cancelled: "outline",
  acknowledged: "outline",
};

const empty: ReminderInput = {
  kind: "rent_due",
  title: "",
  message: "",
  remind_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16),
  channel: "email",
  status: "scheduled",
};

export default function RemindersPage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const ownerId = role === "agent" ? user?.uid : undefined;

  const [rows, setRows] = useState<Reminder[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ReminderInput>(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t, l, i] = await Promise.all([
        reminderService.getAll(ownerId),
        tenantService.getAll(ownerId),
        leaseService.getAll(ownerId),
        invoiceService.getAll(ownerId),
      ]);
      setRows(r);
      setTenants(t);
      setLeases(l);
      setInvoices(i);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
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

  const upcoming = useMemo(() => {
    return rows
      .filter((r) => r.status === "scheduled")
      .sort((a, b) => a.remind_at.localeCompare(b.remind_at));
  }, [rows]);

  const overdueAuto = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return invoices
      .filter(
        (i) =>
          i.status !== "paid" && i.status !== "cancelled" && i.due_date < today,
      )
      .slice(0, 5);
  }, [invoices]);

  function openNew() {
    setForm({ ...empty });
    setOpen(true);
  }

  async function save() {
    if (!form.title || !form.remind_at) {
      toast.error("Title and date are required");
      return;
    }
    setSaving(true);
    try {
      const payload: ReminderInput = {
        ...form,
        ownerId: user?.uid,
        remind_at: new Date(form.remind_at).toISOString(),
      };
      await reminderService.create(payload);
      toast.success("Reminder scheduled");
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function acknowledge(id: string) {
    try {
      await reminderService.acknowledge(id);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "acknowledged" } : r)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await reminderService.delete(deleteId);
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      {overdueAuto.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overdue invoices</CardTitle>
            <CardDescription>
              These invoices are past their due date — schedule a reminder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {overdueAuto.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div>
                    <span className="font-medium">{inv.invoice_number}</span>
                    <span className="ml-2 text-muted-foreground text-xs">
                      Due {inv.due_date}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({
                        ...empty,
                        kind: "invoice_overdue",
                        invoiceId: inv.id,
                        tenantId: inv.tenantId,
                        leaseId: inv.leaseId,
                        title: `Reminder: invoice ${inv.invoice_number} overdue`,
                        message: `Friendly reminder that invoice ${inv.invoice_number} is past its due date (${inv.due_date}).`,
                        remind_at: new Date(Date.now() + 60 * 60 * 1000)
                          .toISOString()
                          .slice(0, 16),
                      });
                      setOpen(true);
                    }}
                  >
                    Schedule reminder
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              <div>
                <CardTitle className="font-light tracking-tight">
                  Reminders
                </CardTitle>
                <CardDescription>
                  Rent-due notices, lease expiry alerts and custom reminders.
                </CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={openNew}>
              <Plus className="mr-2 size-4" />
              New reminder
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
                    <TableHead>When</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Channel</TableHead>
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
                        No reminders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...rows]
                      .sort((a, b) => a.remind_at.localeCompare(b.remind_at))
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">
                            {new Date(r.remind_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate font-medium">
                            {r.title}
                          </TableCell>
                          <TableCell className="capitalize">
                            {r.kind.replace("_", " ")}
                          </TableCell>
                          <TableCell>
                            {r.tenantId ? (tenantMap[r.tenantId] ?? "—") : "—"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {r.channel}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[r.status]}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {r.status === "scheduled" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => acknowledge(r.id)}
                                  title="Acknowledge"
                                >
                                  <CheckCircle2 className="size-4" />
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setDeleteId(r.id)}
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
          {upcoming.length > 0 ? (
            <p className="mt-3 text-muted-foreground text-xs">
              {upcoming.length} reminder(s) scheduled. Outbound delivery is
              handled by your scheduled job/worker — this page tracks lifecycle
              and history.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New reminder</DialogTitle>
            <DialogDescription>
              Schedule an alert for rent due, lease expiry or anything custom.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="kind">Kind</Label>
              <Select
                value={form.kind}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, kind: v as ReminderKind }))
                }
              >
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent_due">Rent due</SelectItem>
                  <SelectItem value="invoice_overdue">
                    Invoice overdue
                  </SelectItem>
                  <SelectItem value="lease_expiring">Lease expiring</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="channel">Channel</Label>
              <Select
                value={form.channel ?? "email"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, channel: v as ReminderChannel }))
                }
              >
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="in_app">In-app</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="tenant">Tenant</Label>
              <Select
                value={form.tenantId ?? ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, tenantId: v || undefined }))
                }
              >
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lease">Lease</Label>
              <Select
                value={form.leaseId ?? ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, leaseId: v || undefined }))
                }
              >
                <SelectTrigger id="lease">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      Lease {l.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="when">Remind at *</Label>
              <Input
                id="when"
                type="datetime-local"
                value={form.remind_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remind_at: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="msg">Message</Label>
              <Textarea
                id="msg"
                rows={3}
                value={form.message ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Schedule reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
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
    </div>
  );
}
