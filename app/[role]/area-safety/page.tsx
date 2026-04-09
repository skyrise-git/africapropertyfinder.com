"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Shield, Pencil, Trash2 } from "lucide-react";
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
import {
  CrimeStationDialog,
  type CrimeStationRow,
} from "./_components/crime-station-dialog";

export default function AreaSafetyAdminPage() {
  const [rows, setRows] = useState<CrimeStationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CrimeStationRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<CrimeStationRow | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("crime_stations")
      .select("*")
      .order("station");
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows(
        (data ?? []).map((r) => ({
          ...r,
          crime_breakdown: (r.crime_breakdown ?? {}) as Record<
            string,
            number
          >,
        })) as CrimeStationRow[],
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const provinces = useMemo(() => {
    const s = new Set(rows.map((r) => r.province).filter(Boolean));
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (provinceFilter !== "all" && r.province !== provinceFilter)
        return false;
      if (ratingFilter !== "all" && String(r.safety_rating) !== ratingFilter)
        return false;
      if (!t) return true;
      return (
        r.station.toLowerCase().includes(t) ||
        r.district.toLowerCase().includes(t) ||
        r.province.toLowerCase().includes(t)
      );
    });
  }, [rows, search, provinceFilter, ratingFilter]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (r: CrimeStationRow) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("crime_stations")
      .delete()
      .eq("id", deleteRow.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Record deleted");
      setRows((prev) => prev.filter((x) => x.id !== deleteRow.id));
    }
    setDeleteRow(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-6 text-primary" />
              <div>
                <CardTitle className="font-light tracking-tight">
                  Area safety data
                </CardTitle>
                <CardDescription>
                  Crime safety index by police station / area. Public site reads
                  from this table.
                </CardDescription>
              </div>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 size-4" />
              Add record
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search station, district, province…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All provinces</SelectItem>
                {provinces.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                {["5", "4", "3", "2", "1"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} / 5
                  </SelectItem>
                ))}
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
                    <TableHead>Station</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        No records match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.station}</TableCell>
                        <TableCell>{r.district}</TableCell>
                        <TableCell>{r.province}</TableCell>
                        <TableCell>
                          {r.safety_rating} — {r.safety_label}
                        </TableCell>
                        <TableCell>{r.crime_index}</TableCell>
                        <TableCell>{r.trend}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(r)}
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

      <CrimeStationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />

      <AlertDialog
        open={!!deleteRow}
        onOpenChange={() => setDeleteRow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this safety record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow?.station} — this will remove it from public safety
              data.
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
