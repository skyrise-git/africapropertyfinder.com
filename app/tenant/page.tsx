"use client";

import { Building2, FileText, Receipt, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/hooks/use-app-store";
import { propertyService } from "@/lib/services/property.service";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types/property.type";
import type {
  Invoice,
  Lease,
  MaintenanceRequest,
  Payment,
  Tenant,
} from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";

export default function TenantHomePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maint, setMaint] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      // RLS scopes everything to the linked tenant for non-admin users.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [tRes, lRes, iRes, pRes, mRes] = await Promise.all([
        db.from("pm_tenants").select("*").maybeSingle(),
        db.from("pm_leases").select("*"),
        db
          .from("pm_invoices")
          .select("*")
          .order("issue_date", { ascending: false }),
        db
          .from("pm_payments")
          .select("*")
          .order("paid_on", { ascending: false }),
        db
          .from("pm_maintenance_requests")
          .select("*")
          .order("createdAt", { ascending: false }),
      ]);
      if (tRes.error && tRes.error.code !== "PGRST116") {
        throw new Error(tRes.error.message);
      }
      setTenant((tRes.data ?? null) as Tenant | null);
      setLeases((lRes.data ?? []) as Lease[]);
      setInvoices((iRes.data ?? []) as Invoice[]);
      setPayments((pRes.data ?? []) as Payment[]);
      setMaint((mRes.data ?? []) as MaintenanceRequest[]);

      const propIds = Array.from(
        new Set(((lRes.data ?? []) as Lease[]).map((l) => l.propertyId)),
      );
      if (propIds.length > 0) {
        const map: Record<string, Property> = {};
        await Promise.all(
          propIds.map(async (id) => {
            const p = await propertyService.getById(id);
            if (p) map[id] = p;
          }),
        );
        setProperties(map);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/signin?redirect=/tenant");
        return;
      }
      setAuthChecked(true);
      load();
    })();
  }, [router, load]);

  if (!authChecked) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <Empty>
        <EmptyTitle>Your account isn't linked to a tenant yet</EmptyTitle>
        <EmptyDescription>
          If your landlord or agent sent you an invite link, open it to link
          your account. Otherwise ask them to send one.
        </EmptyDescription>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </Empty>
    );
  }

  const lease = leases[0];
  const property = lease ? properties[lease.propertyId] : null;
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => {
      const paid = payments
        .filter((p) => p.invoiceId === i.id)
        .reduce((x, p) => x + Number(p.amount ?? 0), 0);
      return s + Math.max(0, Number(i.total ?? 0) - paid);
    }, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-light text-2xl tracking-tight">
                Hello, {tenant.name}
              </CardTitle>
              <CardDescription>
                {user?.email ?? ""} ·{" "}
                {tenant.linked_user_id ? "linked account" : "pending link"}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Outstanding
              </div>
              <div className="text-2xl font-light tabular-nums text-amber-600">
                {formatMoney(
                  outstanding,
                  invoices[0]?.currency ?? lease?.currency ?? "ZAR",
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lease && property ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="font-medium">{property.title}</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {property.address}, {property.city}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="font-medium">Lease</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {lease.start_date} → {lease.end_date ?? "—"} ·{" "}
                  {formatMoney(Number(lease.rent_amount), lease.currency)} /{" "}
                  {lease.payment_frequency}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active lease yet. Your landlord will create one for you.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base">
                Invoices &amp; receipts
              </CardTitle>
              <CardDescription>Your full billing history.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell>{inv.issue_date}</TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(inv.total), inv.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "default"
                              : inv.status === "overdue"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base">Maintenance</CardTitle>
              <CardDescription>
                Recent requests for your property.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {maint.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No maintenance requests on file.
            </p>
          ) : (
            <ul className="space-y-2">
              {maint.slice(0, 6).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">
                      {m.title}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      reported {m.reported_on}
                    </div>
                  </div>
                  <Badge variant="secondary">{m.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
