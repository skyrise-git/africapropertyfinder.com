"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, Plus, Pencil, Search, Trash2 } from "lucide-react";
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
import {
  PriceEstimateDialog,
  type PriceEstimateRow,
} from "./_components/price-estimate-dialog";

function fmt(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(n);
}

export default function PriceEstimatesAdminPage() {
  const [rows, setRows] = useState<PriceEstimateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PriceEstimateRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<PriceEstimateRow | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("price_estimates")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as PriceEstimateRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => {
      return (
        r.city.toLowerCase().includes(t) ||
        r.province.toLowerCase().includes(t) ||
        r.suburb.toLowerCase().includes(t) ||
        r.country.toLowerCase().includes(t)
      );
    });
  }, [rows, search]);

  const confirmDelete = async () => {
    if (!deleteRow) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("price_estimates")
      .delete()
      .eq("id", deleteRow.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setRows((prev) => prev.filter((x) => x.id !== deleteRow.id));
    }
    setDeleteRow(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="size-6 text-primary" />
              <div>
                <CardTitle className="font-light tracking-tight">
                  Price estimates
                </CardTitle>
                <CardDescription>
                  APF estimates by location; matched on property detail pages.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add estimate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search country, province, city, suburb…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Low–High</TableHead>
                    <TableHead>YoY %</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        No estimates yet. Add one or widen your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">
                            {r.city}
                            {r.suburb ? ` · ${r.suburb}` : ""}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.country}
                            {r.province ? ` · ${r.province}` : ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.listingType ?? "any"}
                          {r.propertyType ? ` / ${r.propertyType}` : ""}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {fmt(r.estimateLow)} – {fmt(r.estimateHigh)}
                          <div className="text-muted-foreground text-xs">
                            mid {fmt(r.estimateMid)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.yoyGrowthPct != null ? `${r.yoyGrowthPct}%` : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{r.source}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(r);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteRow(r)}
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
      </Card>

      <PriceEstimateDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSaved={load}
      />

      <AlertDialog
        open={!!deleteRow}
        onOpenChange={() => setDeleteRow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow?.city} — cannot be undone.
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
