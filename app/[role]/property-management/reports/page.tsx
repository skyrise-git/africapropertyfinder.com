"use client";

import { BarChart3 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/hooks/use-app-store";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils/money";

interface CashflowRow {
  owner_id: string | null;
  month: string;
  collected: number | string;
  outstanding: number | string;
}

interface AgingRow {
  owner_id: string | null;
  bucket: "current" | "1-30" | "31-60" | "61-90" | "90+";
  amount: number | string;
  invoice_count: number;
}

interface OccupancyRow {
  owner_id: string | null;
  managed_total: number;
  occupied: number;
  vacant: number;
  expiring_90d: number;
}

interface FunnelRow {
  agent_id: string | null;
  rent_listings: number;
  rent_under_management: number;
  active_lease_properties: number;
}

interface CityRow {
  city: string;
  managed: number;
  occupied: number;
  active_rent_value: number | string;
}

interface SlaRow {
  owner_id: string | null;
  resolved: number;
  open_count: number;
  avg_days_to_resolve: number | null;
}

const AGING_ORDER = ["current", "1-30", "31-60", "61-90", "90+"] as const;
const AGING_COLORS: Record<string, string> = {
  current: "#10b981",
  "1-30": "#f59e0b",
  "31-60": "#f97316",
  "61-90": "#ef4444",
  "90+": "#7f1d1d",
};

export default function PmReportsPage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const isAdmin = role === "admin" || role === "staff";
  const ownerId = !isAdmin ? user?.uid : null;

  const [cashflow, setCashflow] = useState<CashflowRow[]>([]);
  const [aging, setAging] = useState<AgingRow[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyRow | null>(null);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [cityRows, setCityRows] = useState<CityRow[]>([]);
  const [sla, setSla] = useState<SlaRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    try {
      const cfQ = db
        .from("pm_v_owner_cashflow_monthly")
        .select("*")
        .order("month", { ascending: true });
      const agingQ = db.from("pm_v_owner_aging").select("*");
      const occQ = db.from("pm_v_owner_occupancy").select("*").maybeSingle();
      const slaQ = db
        .from("pm_v_owner_maintenance_sla")
        .select("*")
        .maybeSingle();
      const funQ = db.from("pm_v_agent_funnel").select("*");
      const cityQ = db.from("pm_v_admin_city_rollup").select("*");

      const filterOwner = (q: { eq: (col: string, v: string) => unknown }) =>
        ownerId
          ? (q.eq as (c: string, v: string) => unknown)("owner_id", ownerId)
          : q;

      const [cfRes, agingRes, occRes, slaRes, funRes, cityRes] =
        await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (filterOwner(cfQ) as any).then(
            (r: { data: CashflowRow[] | null }) => r,
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (filterOwner(agingQ) as any).then(
            (r: { data: AgingRow[] | null }) => r,
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (filterOwner(occQ) as any).then(
            (r: { data: OccupancyRow | null }) => r,
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (filterOwner(slaQ) as any).then((r: { data: SlaRow | null }) => r),
          isAdmin ? funQ : Promise.resolve({ data: [] as FunnelRow[] }),
          isAdmin ? cityQ : Promise.resolve({ data: [] as CityRow[] }),
        ]);

      setCashflow((cfRes.data ?? []) as CashflowRow[]);
      setAging((agingRes.data ?? []) as AgingRow[]);
      setOccupancy((occRes.data as OccupancyRow | null) ?? null);
      setSla((slaRes.data as SlaRow | null) ?? null);
      setFunnel((funRes.data ?? []) as FunnelRow[]);
      setCityRows((cityRes.data ?? []) as CityRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [ownerId, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const cashflowChart = cashflow.map((r) => ({
    month: r.month,
    Collected: Number(r.collected) || 0,
    Outstanding: Number(r.outstanding) || 0,
  }));

  const agingChart = [...AGING_ORDER].map((bucket) => {
    const found = aging.find((a) => a.bucket === bucket);
    return {
      bucket,
      amount: Number(found?.amount ?? 0),
      count: found?.invoice_count ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              <div>
                <CardTitle className="text-base">Cashflow by month</CardTitle>
                <CardDescription>
                  Collections vs outstanding by month.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cashflowChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No data yet. Generate invoices and record payments to see this.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashflowChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [formatMoney(v), ""]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Collected"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="Outstanding"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging buckets</CardTitle>
            <CardDescription>
              Outstanding balances by days past due.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [formatMoney(v), "Amount"]}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {agingChart.map((row) => (
                      <Cell key={row.bucket} fill={AGING_COLORS[row.bucket]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Managed" value={occupancy?.managed_total ?? 0} />
              <Stat label="Occupied" value={occupancy?.occupied ?? 0} />
              <Stat label="Vacant" value={occupancy?.vacant ?? 0} />
              <Stat label="Expiring 90d" value={occupancy?.expiring_90d ?? 0} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Open" value={sla?.open_count ?? 0} />
              <Stat label="Resolved" value={sla?.resolved ?? 0} />
              <Stat
                label="Avg days to resolve"
                value={
                  sla?.avg_days_to_resolve != null
                    ? sla.avg_days_to_resolve.toFixed(1)
                    : "—"
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging total</CardTitle>
            <CardDescription>Sum of unpaid balances.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light tabular-nums text-amber-600">
              {formatMoney(
                aging.reduce((s, a) => s + Number(a.amount ?? 0), 0),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent upsell funnel</CardTitle>
              <CardDescription>
                Rent listings converted to managed properties and active leases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnel.length === 0 ? (
                <p className="text-sm text-muted-foreground">No agents yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Listings</TableHead>
                      <TableHead className="text-right">Managed</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funnel.map((row) => (
                      <TableRow key={row.agent_id ?? "unknown"}>
                        <TableCell className="font-medium text-xs">
                          {row.agent_id?.slice(0, 8) ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.rent_listings}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.rent_under_management}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.active_lease_properties}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">By city</CardTitle>
              <CardDescription>
                Managed properties and active rent value.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cityRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Managed</TableHead>
                      <TableHead className="text-right">Occupied</TableHead>
                      <TableHead className="text-right">Rent value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cityRows.slice(0, 12).map((row) => (
                      <TableRow key={row.city || "—"}>
                        <TableCell>{row.city || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.managed}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.occupied}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(Number(row.active_rent_value))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-xl font-light tabular-nums">{value}</dd>
    </div>
  );
}
