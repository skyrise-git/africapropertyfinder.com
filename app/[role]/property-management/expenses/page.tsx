"use client";

import { Plus, Trash2, Wallet } from "lucide-react";
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
import { expenseService } from "@/lib/services/property-management.service";
import type { Property } from "@/lib/types/property.type";
import type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
} from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";

const emptyExpense: ExpenseInput = {
  propertyId: "",
  category: "other",
  description: "",
  amount: 0,
  currency: "ZAR",
  spent_on: new Date().toISOString().slice(0, 10),
  vendor: "",
};

export default function ExpensesPage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const ownerId = role === "agent" ? user?.uid : undefined;

  const [rows, setRows] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExpenseInput>(emptyExpense);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expenseService.getAll(ownerId);
      const props = ownerId
        ? await propertyService.getByUserId(ownerId)
        : await propertyService.getAll();
      setRows(data);
      setProperties(props);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
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

  const total = useMemo(
    () => rows.reduce((s, r) => s + Number(r.amount ?? 0), 0),
    [rows],
  );

  function openNew() {
    setForm({ ...emptyExpense, propertyId: properties[0]?.id ?? "" });
    setOpen(true);
  }

  async function save() {
    if (!form.propertyId || !form.description || !form.amount) {
      toast.error("Property, description and amount are required");
      return;
    }
    setSaving(true);
    try {
      await expenseService.create({ ...form, ownerId: user?.uid });
      toast.success("Expense recorded");
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await expenseService.delete(deleteId);
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Expense deleted");
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
            <Wallet className="size-5 text-primary" />
            <div>
              <CardTitle className="font-light tracking-tight">
                Expenses
              </CardTitle>
              <CardDescription>
                Track maintenance, levies, rates and other costs per property.
              </CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-2 size-4" />
            Add expense
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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
                        No expenses yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.spent_on}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {propertyMap[e.propertyId] ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {e.category.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate">
                          {e.description}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {e.vendor ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(Number(e.amount), e.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(e.id)}
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
            <div className="flex justify-end text-sm text-muted-foreground">
              Total:{" "}
              <span className="ml-2 font-medium tabular-nums text-foreground">
                {formatMoney(total)}
              </span>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>
              Costs incurred against a property.
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
            <div>
              <Label htmlFor="cat">Category</Label>
              <Select
                value={form.category ?? "other"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as ExpenseCategory }))
                }
              >
                <SelectTrigger id="cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="rates">Rates</SelectItem>
                  <SelectItem value="levies">Levies</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="management_fee">Management fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="spent">Date *</Label>
              <Input
                id="spent"
                type="date"
                value={form.spent_on ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spent_on: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="desc">Description *</Label>
              <Input
                id="desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
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
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={form.vendor ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendor: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="receipt">Receipt URL</Label>
              <Textarea
                id="receipt"
                rows={2}
                value={form.receipt_url ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, receipt_url: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Add expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
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
