"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Filter } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

export type AppointmentRow = {
  id: string;
  propertyId: string | null;
  propertyTitle: string | null;
  date: string;
  time: string;
  tourType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  requestedBy: Record<string, unknown> | null;
  status: string;
  notes: string;
  createdAt: string;
};

export default function AdminAppointmentsPage() {
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows(
        (data ?? []).map((r) => ({
          ...r,
          status: (r as { status?: string }).status ?? "pending",
          notes: (r as { notes?: string }).notes ?? "",
        })) as AppointmentRow[],
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!t) return true;
      const hay = [
        r.propertyTitle,
        r.contactName,
        r.contactEmail,
        r.contactPhone,
        r.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [rows, search, statusFilter]);

  const openDetail = (r: AppointmentRow) => {
    setSelected(r);
    setEditStatus(r.status);
    setEditNotes(r.notes ?? "");
  };

  const saveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status: editStatus, notes: editNotes })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Appointment updated");
    setRows((prev) =>
      prev.map((x) =>
        x.id === selected.id
          ? { ...x, status: editStatus, notes: editNotes }
          : x,
      ),
    );
    setSelected(null);
  };

  const exportCsv = () => {
    const header = ["id", "date", "time", "propertyTitle", "contactName", "contactEmail", "contactPhone", "status", "notes"];
    const csv = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.id,
          r.date,
          r.time,
          `"${(r.propertyTitle ?? "").replaceAll('"', '""')}"`,
          `"${(r.contactName ?? "").replaceAll('"', '""')}"`,
          r.contactEmail ?? "",
          r.contactPhone ?? "",
          r.status,
          `"${(r.notes ?? "").replaceAll('"', '""')}"`,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "appointments-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-6 text-primary" />
            <div>
              <CardTitle className="font-light tracking-tight">
                Appointments
              </CardTitle>
              <CardDescription>
                Viewing requests across all properties. Update status and
                internal notes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              placeholder="Search property, contact, date…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="lg:ml-auto" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        No appointments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.time}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate font-medium">
                            {r.propertyTitle ?? "—"}
                          </div>
                          {r.propertyId && (
                            <Link
                              href={`/properties/${r.propertyId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              View listing
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{r.contactName ?? "—"}</div>
                          <div className="text-muted-foreground">
                            {r.contactEmail ?? ""}
                          </div>
                        </TableCell>
                        <TableCell>{r.tourType ?? "—"}</TableCell>
                        <TableCell>
                          <span className="capitalize">{r.status}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetail(r)}
                          >
                            Manage
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
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Appointment</SheetTitle>
            <SheetDescription>
              {selected?.propertyTitle ?? "Listing"}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">When:</span>{" "}
                  {selected.date} at {selected.time}
                </p>
                <p>
                  <span className="text-muted-foreground">Contact:</span>{" "}
                  {selected.contactName} · {selected.contactEmail} ·{" "}
                  {selected.contactPhone}
                </p>
                {selected.requestedBy && (
                  <p className="break-all text-muted-foreground text-xs">
                    Requested by: {JSON.stringify(selected.requestedBy)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Internal notes</Label>
                <Textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Visible to admin and staff only"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveDetail} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
