"use client";

import { CheckCircle2, Mail, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { tenantService } from "@/lib/services/property-management.service";
import type {
  Tenant,
  TenantInput,
  TenantStatus,
} from "@/lib/types/property-management.type";

const emptyTenant: TenantInput = {
  name: "",
  email: "",
  phone: "",
  national_id: "",
  occupation: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
  status: "active",
};

export default function TenantsPage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const ownerId = role === "agent" ? user?.uid : undefined;

  const [rows, setRows] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TenantInput>(emptyTenant);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tenantService.getAll(ownerId);
      setRows(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(t) ||
        (r.email ?? "").toLowerCase().includes(t) ||
        (r.phone ?? "").toLowerCase().includes(t),
    );
  }, [rows, search]);

  function openNew() {
    setEditing(null);
    setForm(emptyTenant);
    setOpen(true);
  }

  function openEdit(t: Tenant) {
    setEditing(t);
    setForm({
      name: t.name,
      email: t.email ?? "",
      phone: t.phone ?? "",
      national_id: t.national_id ?? "",
      occupation: t.occupation ?? "",
      emergency_contact_name: t.emergency_contact_name ?? "",
      emergency_contact_phone: t.emergency_contact_phone ?? "",
      notes: t.notes ?? "",
      status: t.status,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await tenantService.update(editing.id, form);
        toast.success("Tenant updated");
      } else {
        await tenantService.create({ ...form, ownerId: user?.uid });
        toast.success("Tenant added");
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
      await tenantService.delete(deleteId);
      toast.success("Tenant deleted");
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  async function inviteToPortal(t: Tenant) {
    if (!t.email) {
      toast.error("Add an email on the tenant first");
      return;
    }
    try {
      const token = await tenantService.issueInvite(t.id);
      const url = `${window.location.origin}/tenant-invite/${token}`;
      try {
        await navigator.clipboard?.writeText(url);
        toast.success("Invite link copied. Send it to the tenant.");
      } catch {
        toast.success(`Invite link: ${url}`);
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === t.id
            ? {
                ...row,
                invite_token: token,
                invite_sent_at: new Date().toISOString(),
              }
            : row,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <div>
              <CardTitle className="font-light tracking-tight">
                Tenants
              </CardTitle>
              <CardDescription>
                Manage tenant contact details and lifecycle status.
              </CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-2 size-4" />
            Add tenant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No tenants yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.phone ?? "—"}
                      </TableCell>
                      <TableCell>
                        {t.linked_user_id ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="size-3" /> linked
                          </Badge>
                        ) : t.invite_sent_at ? (
                          <Badge variant="secondary">invited</Badge>
                        ) : (
                          <Badge variant="outline">no portal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === "active" ? "default" : "secondary"
                          }
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!t.linked_user_id ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Invite tenant to portal"
                              onClick={() => inviteToPortal(t)}
                            >
                              <Mail className="size-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(t)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(t.id)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit tenant" : "Add tenant"}</DialogTitle>
            <DialogDescription>
              Tenant contact info and status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="nid">National ID</Label>
              <Input
                id="nid"
                value={form.national_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, national_id: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="occ">Occupation</Label>
              <Input
                id="occ"
                value={form.occupation ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, occupation: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="ec_name">Emergency contact name</Label>
              <Input
                id="ec_name"
                value={form.emergency_contact_name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    emergency_contact_name: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="ec_phone">Emergency contact phone</Label>
              <Input
                id="ec_phone"
                value={form.emergency_contact_phone ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    emergency_contact_phone: e.target.value,
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status ?? "active"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as TenantStatus }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              Their leases, invoices, and payments will be removed too. This
              cannot be undone.
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
