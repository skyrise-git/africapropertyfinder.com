"use client";

import { Banknote, CheckCircle2, Download, Plus, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils/money";

interface OwnerBalance {
  owner_id: string | null;
  outstanding_to_owner: number | string;
  lifetime_fee_revenue: number | string;
  lifetime_collected: number | string;
}

interface PayoutRow {
  id: string;
  ownerId: string;
  gross_amount: number | string;
  platform_fee_amount: number | string;
  processor_fee_amount: number | string;
  net_amount: number | string;
  currency: string;
  status: string;
  method?: string;
  reference?: string;
  notes?: string;
  approved_at?: string;
  sent_at?: string;
  reconciled_at?: string;
  createdAt: string;
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  approved: "secondary",
  sent: "secondary",
  reconciled: "default",
  failed: "destructive",
  cancelled: "outline",
};

export default function PayoutsConsolePage() {
  const params = useParams();
  const role = params.role as string;
  const isAdmin = role === "admin" || role === "staff";
  const { user } = useAppStore();

  const [balances, setBalances] = useState<OwnerBalance[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    ownerId: "",
    gross_amount: 0,
    platform_fee_amount: 0,
    processor_fee_amount: 0,
    currency: "USD",
    method: "bank_transfer",
    reference: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    try {
      const balancesQ = db.from("pm_v_owner_balances").select("*");
      const payoutsQ = db
        .from("pm_payouts")
        .select("*")
        .order("createdAt", { ascending: false });

      const [balRes, payRes] = await Promise.all([
        isAdmin ? balancesQ : balancesQ.eq("owner_id", user?.uid ?? "_"),
        isAdmin ? payoutsQ : payoutsQ.eq("ownerId", user?.uid ?? "_"),
      ]);

      const bal = (balRes.data ?? []) as OwnerBalance[];
      setBalances(bal);
      setPayouts((payRes.data ?? []) as PayoutRow[]);

      const ids = Array.from(
        new Set(bal.map((b) => b.owner_id).filter(Boolean) as string[]),
      );
      if (ids.length) {
        const { data: profs } = await db
          .from("profiles")
          .select("id,name,email")
          .in("id", ids);
        const map: Record<string, string> = {};
        (profs ?? []).forEach(
          (p: { id: string; name?: string; email?: string }) => {
            map[p.id] = p.name || p.email || p.id.slice(0, 6);
          },
        );
        setProfiles(map);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    return balances.reduce(
      (acc, b) => {
        acc.outstanding += Number(b.outstanding_to_owner ?? 0);
        acc.fee += Number(b.lifetime_fee_revenue ?? 0);
        acc.collected += Number(b.lifetime_collected ?? 0);
        return acc;
      },
      { outstanding: 0, fee: 0, collected: 0 },
    );
  }, [balances]);

  function openNewFor(ownerId: string, gross: number) {
    setForm({
      ownerId,
      gross_amount: gross,
      platform_fee_amount: 0,
      processor_fee_amount: 0,
      currency: "USD",
      method: "bank_transfer",
      reference: "",
      notes: "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.ownerId || form.gross_amount <= 0) {
      toast.error("Owner and gross amount required");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const net =
        Number(form.gross_amount) -
        Number(form.platform_fee_amount) -
        Number(form.processor_fee_amount);
      const nowIso = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("pm_payouts").insert({
        ownerId: form.ownerId,
        gross_amount: Number(form.gross_amount),
        platform_fee_amount: Number(form.platform_fee_amount),
        processor_fee_amount: Number(form.processor_fee_amount),
        net_amount: net,
        currency: form.currency,
        method: form.method,
        reference: form.reference || null,
        notes: form.notes || null,
        status: "draft",
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      if (error) throw new Error(error.message);
      toast.success("Payout drafted");
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(p: PayoutRow, status: string) {
    const supabase = createClient();
    const patch: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "sent") patch.sent_at = new Date().toISOString();
    if (status === "reconciled") {
      patch.reconciled_at = new Date().toISOString();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("pm_payouts")
      .update(patch)
      .eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (status === "reconciled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("pm_ledger_entries").insert({
        ownerId: p.ownerId,
        payoutId: p.id,
        account: "payout",
        amount: Number(p.net_amount),
        currency: p.currency,
        memo: `Payout ${p.reference ?? p.id}`,
      });
    }
    toast.success(`Payout ${status}`);
    load();
  }

  function exportCsv() {
    const header = [
      "id",
      "ownerId",
      "owner",
      "gross",
      "platform_fee",
      "processor_fee",
      "net",
      "currency",
      "status",
      "method",
      "reference",
      "createdAt",
    ];
    const rows = payouts.map((p) =>
      [
        p.id,
        p.ownerId,
        `"${(profiles[p.ownerId] || "").replaceAll('"', '""')}"`,
        Number(p.gross_amount),
        Number(p.platform_fee_amount),
        Number(p.processor_fee_amount),
        Number(p.net_amount),
        p.currency,
        p.status,
        p.method ?? "",
        p.reference ?? "",
        p.createdAt,
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payouts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Outstanding to owners"
          value={formatMoney(totals.outstanding, "USD")}
          accent="text-amber-600"
        />
        <KpiCard
          label="Lifetime collected"
          value={formatMoney(totals.collected, "USD")}
        />
        <KpiCard
          label="Lifetime fee revenue"
          value={formatMoney(totals.fee, "USD")}
          accent="text-emerald-600"
        />
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Owner balances</CardTitle>
                  <CardDescription>
                    Outstanding liability per owner. Click to draft a payout.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No balances accrued yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Fee revenue</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((b) => (
                    <TableRow key={b.owner_id ?? "—"}>
                      <TableCell className="text-xs">
                        {b.owner_id
                          ? (profiles[b.owner_id] ?? b.owner_id.slice(0, 8))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(b.outstanding_to_owner))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(b.lifetime_collected))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(b.lifetime_fee_revenue))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={Number(b.outstanding_to_owner) <= 0}
                          onClick={() =>
                            openNewFor(
                              b.owner_id as string,
                              Number(b.outstanding_to_owner),
                            )
                          }
                        >
                          <Plus className="mr-1 size-3" /> Draft payout
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payouts</CardTitle>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="mr-2 size-3" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin ? (
                    <TableHead className="text-right">Actions</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.createdAt.slice(0, 10)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {profiles[p.ownerId] ?? p.ownerId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(p.gross_amount), p.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(p.net_amount), p.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status] ?? "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {p.status === "draft" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStatus(p, "approved")}
                            >
                              Approve
                            </Button>
                          ) : null}
                          {p.status === "approved" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStatus(p, "sent")}
                            >
                              <Send className="mr-1 size-3" /> Mark sent
                            </Button>
                          ) : null}
                          {p.status === "sent" ? (
                            <Button
                              size="sm"
                              onClick={() => setStatus(p, "reconciled")}
                            >
                              <CheckCircle2 className="mr-1 size-3" /> Reconcile
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Draft payout</DialogTitle>
            <DialogDescription>
              Manually enter the disbursement amount and any pass-through fees.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Owner</Label>
              <div className="text-sm text-muted-foreground">
                {profiles[form.ownerId] ?? form.ownerId.slice(0, 8)}
              </div>
            </div>
            <div>
              <Label htmlFor="gross">Gross</Label>
              <Input
                id="gross"
                type="number"
                step="0.01"
                value={form.gross_amount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gross_amount: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pf">Platform fee</Label>
                <Input
                  id="pf"
                  type="number"
                  step="0.01"
                  value={form.platform_fee_amount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      platform_fee_amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="prof">Processor fee</Label>
                <Input
                  id="prof"
                  type="number"
                  step="0.01"
                  value={form.processor_fee_amount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      processor_fee_amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                value={form.reference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reference: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <div className="rounded-md border bg-muted/30 p-2 text-sm">
              Net to owner:{" "}
              <span className="font-medium tabular-nums">
                {formatMoney(
                  Number(form.gross_amount) -
                    Number(form.platform_fee_amount) -
                    Number(form.processor_fee_amount),
                  form.currency,
                )}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Create draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-light tabular-nums ${accent ?? ""}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
