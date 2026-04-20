"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  Pencil,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types/property.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/hooks/use-app-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type PropertyRow = Property & { id: string };

type ListingMetrics = { views: number; saved: number; viewings: number };

function formatMoney(n: number | undefined | null, currency = "ZAR") {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminPropertiesPage() {
  const params = useParams();
  const role = params.role as string;
  const { user } = useAppStore();
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Record<string, ListingMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("*")
      .order("createdAt", { ascending: false });
    if (role === "agent" && user?.uid) {
      query = query.eq("userId", user.uid);
    }
    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      setRows([]);
      setMetrics({});
    } else {
      const list = (data ?? []) as unknown as PropertyRow[];
      setRows(list);
      const ids = [
        ...new Set(
          (data ?? [])
            .map((r) => (r as { userId?: string }).userId)
            .filter(Boolean),
        ),
      ] as string[];
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,email,name")
          .in("id", ids);
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p) => {
          map[p.id as string] = (p.email as string) || (p.name as string) || p.id;
        });
        setProfiles(map);
      } else {
        setProfiles({});
      }

      if (role === "agent" && list.length > 0) {
        const pids = list.map((p) => p.id);
        const [viewsRes, savedRes, apptRes] = await Promise.all([
          supabase.from("property_views").select("property_id").in("property_id", pids),
          supabase.from("savedProperties").select("propertyId").in("propertyId", pids),
          supabase.from("appointments").select("propertyId").in("propertyId", pids),
        ]);
        const next: Record<string, ListingMetrics> = {};
        for (const id of pids) {
          next[id] = { views: 0, saved: 0, viewings: 0 };
        }
        for (const r of viewsRes.data ?? []) {
          const pid = (r as { property_id: string }).property_id;
          if (next[pid]) next[pid].views += 1;
        }
        for (const r of savedRes.data ?? []) {
          const pid = (r as { propertyId: string }).propertyId;
          if (next[pid]) next[pid].saved += 1;
        }
        for (const r of apptRes.data ?? []) {
          const pid = (r as { propertyId: string }).propertyId;
          if (next[pid]) next[pid].viewings += 1;
        }
        setMetrics(next);
      } else {
        setMetrics({});
      }
    }
    setLoading(false);
  }, [role, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (listingFilter !== "all" && p.listingType !== listingFilter)
        return false;
      if (!t) return true;
      return (
        p.title.toLowerCase().includes(t) ||
        p.city.toLowerCase().includes(t) ||
        p.address.toLowerCase().includes(t)
      );
    });
  }, [rows, search, listingFilter]);

  const toggleFeatured = async (p: PropertyRow) => {
    const supabase = createClient();
    const next = !p.featured;
    const { error } = await supabase
      .from("properties")
      .update({ featured: next })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(next ? "Marked featured" : "Removed from featured");
      setRows((prev) =>
        prev.map((r) => (r.id === p.id ? { ...r, featured: next } : r)),
      );
    }
  };

  const setStatus = async (
    p: PropertyRow,
    status: NonNullable<PropertyRow["status"]>,
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("properties")
      .update({ status })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      setRows((prev) =>
        prev.map((r) => (r.id === p.id ? { ...r, status } : r)),
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Property deleted");
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
    }
    setDeleteId(null);
  };

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.includes(r.id)),
    [rows, selectedIds]
  );

  const exportCsv = () => {
    const exportRows = selectedRows.length > 0 ? selectedRows : filtered;
    const header = [
      "id",
      "title",
      "owner",
      "city",
      "country",
      "listingType",
      "status",
      "featured",
      "price",
      "rent",
      "createdAt",
    ];
    const csv = [
      header.join(","),
      ...exportRows.map((r) =>
        [
          r.id,
          `"${r.title.replaceAll('"', '""')}"`,
          `"${(r.userId && profiles[r.userId]) || ""}"`,
          `"${r.city}"`,
          `"${r.country}"`,
          r.listingType,
          r.status ?? "active",
          String(!!r.featured),
          r.price ?? "",
          r.rent ?? "",
          r.createdAt,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "properties-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkSetStatus = async (status: NonNullable<PropertyRow["status"]>) => {
    if (selectedIds.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("properties")
      .update({ status })
      .in("id", selectedIds);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Updated ${selectedIds.length} listing(s)`);
    setRows((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status } : r))
    );
    setSelectedIds([]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-6 text-primary" />
              <div>
                <CardTitle className="font-light tracking-tight">
                  Properties
                </CardTitle>
                <CardDescription>
                  {role === "agent"
                    ? "Your listings and engagement metrics."
                    : "Manage all listings, status, and featured placement."}
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/properties/create">
                <ExternalLink className="mr-2 size-4" />
                New listing
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, city, address…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={listingFilter} onValueChange={setListingFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Listing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="student-housing">Student housing</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="lg:ml-auto" onClick={exportCsv}>
              Export CSV
            </Button>
            {role !== "agent" && (
              <Select onValueChange={(v) => bulkSetStatus(v as NonNullable<PropertyRow["status"]>)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Bulk status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Set active</SelectItem>
                  <SelectItem value="inactive">Set inactive</SelectItem>
                  <SelectItem value="pending">Set pending</SelectItem>
                  <SelectItem value="booked">Set booked</SelectItem>
                  <SelectItem value="sold">Set sold</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id))}
                        onCheckedChange={(checked) =>
                          setSelectedIds(
                            checked ? filtered.map((r) => r.id) : []
                          )
                        }
                        aria-label="Select all properties"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    {role !== "agent" && <TableHead>Owner</TableHead>}
                    <TableHead>City</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price / Rent</TableHead>
                    {role === "agent" && (
                      <>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Saved</TableHead>
                        <TableHead className="text-right">Viewings</TableHead>
                      </>
                    )}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={role === "agent" ? 10 : 8}
                        className="text-center py-10"
                      >
                        No properties match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(p.id)}
                            onCheckedChange={(checked) =>
                              setSelectedIds((prev) =>
                                checked
                                  ? [...prev, p.id]
                                  : prev.filter((id) => id !== p.id)
                              )
                            }
                            aria-label={`Select ${p.title}`}
                          />
                        </TableCell>
                        <TableCell className="max-w-[200px] font-medium">
                          <div className="flex flex-wrap items-center gap-1">
                            {p.featured && (
                              <Badge variant="secondary" className="text-xs">
                                Featured
                              </Badge>
                            )}
                            <span className="truncate">{p.title}</span>
                          </div>
                        </TableCell>
                        {role !== "agent" && (
                          <TableCell className="text-muted-foreground text-sm">
                            {p.userId && profiles[p.userId]
                              ? profiles[p.userId]
                              : p.userId
                                ? "—"
                                : "—"}
                          </TableCell>
                        )}
                        <TableCell>{p.city}</TableCell>
                        <TableCell>{p.listingType}</TableCell>
                        <TableCell className="text-right text-sm">
                          {p.listingType === "sale"
                            ? formatMoney(p.price)
                            : formatMoney(p.rent)}
                        </TableCell>
                        {role === "agent" && (
                          <>
                            <TableCell className="text-right text-sm tabular-nums">
                              {metrics[p.id]?.views ?? 0}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {metrics[p.id]?.saved ?? 0}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {metrics[p.id]?.viewings ?? 0}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Select
                            value={p.status ?? "active"}
                            onValueChange={(v) =>
                              setStatus(
                                p,
                                v as NonNullable<PropertyRow["status"]>,
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">active</SelectItem>
                              <SelectItem value="inactive">inactive</SelectItem>
                              <SelectItem value="pending">pending</SelectItem>
                              <SelectItem value="booked">booked</SelectItem>
                              <SelectItem value="sold">sold</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {role !== "agent" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Toggle featured"
                                onClick={() => toggleFeatured(p)}
                              >
                                <Star
                                  className={`size-4 ${p.featured ? "fill-primary text-primary" : ""}`}
                                />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/properties/${p.id}/edit`}>
                                <Pencil className="size-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/properties/${p.id}`}>
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteId(p.id)}
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
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Saved favourites and related appointments
              may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
