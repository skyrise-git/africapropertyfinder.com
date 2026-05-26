"use client";

import { Plus, Trash2, Wrench } from "lucide-react";
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
  maintenanceService,
  tenantService,
} from "@/lib/services/property-management.service";
import type { Property } from "@/lib/types/property.type";
import type {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceRequestInput,
  MaintenanceStatus,
  Tenant,
} from "@/lib/types/property-management.type";

const empty: MaintenanceRequestInput = {
  propertyId: "",
  title: "",
  description: "",
  priority: "medium",
  status: "open",
  reported_on: new Date().toISOString().slice(0, 10),
};

const priorityVariant: Record<
  MaintenancePriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

export default function MaintenancePage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const ownerId = role === "agent" ? user?.uid : undefined;

  const [rows, setRows] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MaintenanceRequestInput>(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([
        maintenanceService.getAll(ownerId),
        tenantService.getAll(ownerId),
      ]);
      const props = ownerId
        ? await propertyService.getByUserId(ownerId)
        : await propertyService.getAll();
      setRows(m);
      setTenants(t);
      setProperties(props);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties],
  );
  const tenantMap = useMemo(
    () => Object.fromEntries(tenants.map((t) => [t.id, t.name])),
    [tenants],
  );

  function openNew() {
    setForm({ ...empty, propertyId: properties[0]?.id ?? "" });
    setOpen(true);
  }

  async function save() {
    if (!form.propertyId || !form.title) {
      toast.error("Property and title are required");
      return;
    }
    setSaving(true);
    try {
      await maintenanceService.create({ ...form, ownerId: user?.uid });
      toast.success("Request logged");
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(r: MaintenanceRequest, status: MaintenanceStatus) {
    try {
      await maintenanceService.update(r.id, {
        status,
        resolved_on:
          status === "resolved"
            ? new Date().toISOString().slice(0, 10)
            : undefined,
      });
      setRows((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, status } : x)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await maintenanceService.delete(deleteId);
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Request deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-primary" />
            <div>
              <CardTitle className="font-light tracking-tight">
                Maintenance
              </CardTitle>
              <CardDescription>
                Tenant repair requests and contractor work.
              </CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-2 size-4" />
            New request
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
                  <TableHead>Reported</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
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
                      Nothing reported.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.reported_on}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {propertyMap[r.propertyId] ?? "—"}
                      </TableCell>
                      <TableCell>
                        {r.tenantId ? (tenantMap[r.tenantId] ?? "—") : "—"}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate font-medium">
                        {r.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant[r.priority]}>
                          {r.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.status}
                          onValueChange={(v) =>
                            setStatus(r, v as MaintenanceStatus)
                          }
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">
                              In progress
                            </SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New maintenance request</DialogTitle>
            <DialogDescription>
              Log a repair, inspection or contractor visit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="prop">Property *</Label>
              <Select
                value={form.propertyId}
                onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v }))}
              >
                <SelectTrigger id="prop">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="tenant">Tenant (optional)</Label>
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
            <div className="sm:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={3}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority ?? "medium"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    priority: v as MaintenancePriority,
                  }))
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rep">Reported on</Label>
              <Input
                id="rep"
                type="date"
                value={form.reported_on ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reported_on: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={form.vendor ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendor: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost estimate</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                step="0.01"
                value={form.cost ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cost: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Create request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete request?</AlertDialogTitle>
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
    </Card>
  );
}
