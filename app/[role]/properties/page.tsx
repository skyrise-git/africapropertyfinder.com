"use client";

import Link from "next/link";
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

function formatMoney(n: number | undefined | null, currency = "ZAR") {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminPropertiesPage() {
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as unknown as PropertyRow[]);
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
    }
    setLoading(false);
  }, []);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-6 text-primary" />
              <div>
                <CardTitle className="font-light tracking-tight">
                  Properties
                </CardTitle>
                <CardDescription>
                  Manage all listings, status, and featured placement.
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          </div>

          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price / Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        No properties match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow key={p.id}>
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
                        <TableCell className="text-muted-foreground text-sm">
                          {p.userId && profiles[p.userId]
                            ? profiles[p.userId]
                            : p.userId
                              ? "—"
                              : "—"}
                        </TableCell>
                        <TableCell>{p.city}</TableCell>
                        <TableCell>{p.listingType}</TableCell>
                        <TableCell className="text-right text-sm">
                          {p.listingType === "sale"
                            ? formatMoney(p.price)
                            : formatMoney(p.rent)}
                        </TableCell>
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
