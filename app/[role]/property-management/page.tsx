"use client";

import {
  AlertCircle,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/hooks/use-app-store";
import {
  expenseService,
  invoiceService,
  leaseService,
  maintenanceService,
  paymentService,
  reminderService,
  tenantService,
} from "@/lib/services/property-management.service";
import type {
  Expense,
  Invoice,
  Lease,
  MaintenanceRequest,
  Payment,
  Reminder,
  Tenant,
} from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";

export default function PropertyManagementOverviewPage() {
  const { user } = useAppStore();
  const params = useParams();
  const role = params.role as string;
  const ownerId = role === "agent" ? user?.uid : undefined;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maint, setMaint] = useState<MaintenanceRequest[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, l, i, p, e, m, r] = await Promise.all([
        tenantService.getAll(ownerId),
        leaseService.getAll(ownerId),
        invoiceService.getAll(ownerId),
        paymentService.getAll(ownerId),
        expenseService.getAll(ownerId),
        maintenanceService.getAll(ownerId),
        reminderService.getAll(ownerId),
      ]);
      setTenants(t);
      setLeases(l);
      setInvoices(i);
      setPayments(p);
      setExpenses(e);
      setMaint(m);
      setReminders(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthIso = monthStart.toISOString().slice(0, 10);

    // Overdue rule (must agree with DB trigger pm_refresh_overdue):
    // an invoice is overdue iff status is 'sent' or 'partial' AND due_date < today.
    // Drafts past due are NOT counted; they show in UI as "Due (draft)".
    const overdue = invoices.filter(
      (i) =>
        (i.status === "sent" ||
          i.status === "partial" ||
          i.status === "overdue") &&
        i.due_date < today,
    );
    const collectedThisMonth = payments
      .filter((p) => p.paid_on >= monthIso)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const outstanding = invoices
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .reduce(
        (sum, i) =>
          sum +
          Number(i.total ?? 0) -
          payments
            .filter((p) => p.invoiceId === i.id)
            .reduce((s, p) => s + Number(p.amount ?? 0), 0),
        0,
      );
    const expensesThisMonth = expenses
      .filter((e) => e.spent_on >= monthIso)
      .reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const openMaint = maint.filter(
      (m) => m.status === "open" || m.status === "in_progress",
    );
    const upcomingReminders = reminders
      .filter((r) => r.status === "scheduled")
      .slice(0, 5);
    const activeLeases = leases.filter((l) => l.status === "active");

    return {
      overdue,
      collectedThisMonth,
      outstanding,
      expensesThisMonth,
      openMaint,
      upcomingReminders,
      activeLeases,
    };
  }, [invoices, payments, expenses, maint, reminders, leases]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "tenants",
          "leases",
          "collected",
          "outstanding",
          "overdue",
          "maint",
          "expenses",
          "reminders",
        ].map((k) => (
          <Skeleton key={k} className="h-28" />
        ))}
      </div>
    );
  }

  // Guided onboarding checklist: shown until the user has completed the
  // tenant -> lease -> invoice -> payment chain at least once.
  const checklist = [
    {
      label: "Add your first tenant",
      done: tenants.length > 0,
      href: `/${role}/property-management/tenants`,
    },
    {
      label: "Create a lease",
      done: leases.length > 0,
      href: `/${role}/property-management/leases`,
    },
    {
      label: "Generate the first invoice",
      done: invoices.length > 0,
      href: `/${role}/property-management/invoices`,
    },
    {
      label: "Record the first payment",
      done: payments.length > 0,
      href: `/${role}/property-management/payments`,
    },
  ];
  const allDone = checklist.every((c) => c.done);

  const kpis: Array<{
    label: string;
    value: string;
    icon: React.ElementType;
    href: string;
    accent?: string;
  }> = [
    {
      label: "Active tenants",
      value: tenants.filter((t) => t.status === "active").length.toString(),
      icon: Users,
      href: "tenants",
    },
    {
      label: "Active leases",
      value: stats.activeLeases.length.toString(),
      icon: Building2,
      href: "leases",
    },
    {
      label: "Collected this month",
      value: formatMoney(stats.collectedThisMonth),
      icon: Wallet,
      href: "payments",
      accent: "text-emerald-600",
    },
    {
      label: "Outstanding",
      value: formatMoney(stats.outstanding),
      icon: Receipt,
      href: "invoices",
      accent: stats.outstanding > 0 ? "text-amber-600" : undefined,
    },
    {
      label: "Overdue invoices",
      value: stats.overdue.length.toString(),
      icon: AlertCircle,
      href: "invoices",
      accent: stats.overdue.length > 0 ? "text-red-600" : undefined,
    },
    {
      label: "Open maintenance",
      value: stats.openMaint.length.toString(),
      icon: Clock,
      href: "maintenance",
    },
    {
      label: "Expenses this month",
      value: formatMoney(stats.expensesThisMonth),
      icon: Wallet,
      href: "expenses",
    },
    {
      label: "Upcoming reminders",
      value: stats.upcomingReminders.length.toString(),
      icon: Bell,
      href: "reminders",
    },
  ];

  return (
    <div className="space-y-6">
      {!allDone ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Get started</CardTitle>
            <CardDescription>
              A short path from new tenant to first paid receipt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {checklist.map((item, idx) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-md border p-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs ${
                        item.done
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span
                      className={`text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {!item.done ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.href}>Start</Link>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={`/${role}/property-management/${k.href}`}
              className="group"
            >
              <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">
                      {k.label}
                    </CardDescription>
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-light tracking-tight ${k.accent ?? ""}`}
                  >
                    {k.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdue invoices</CardTitle>
            <CardDescription>
              Send a reminder or record a payment to clear them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.overdue.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Nothing overdue. Nice work.
              </div>
            ) : (
              <ul className="space-y-2">
                {stats.overdue.slice(0, 6).map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {inv.invoice_number}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Due {inv.due_date}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">overdue</Badge>
                      <span className="text-sm tabular-nums">
                        {formatMoney(Number(inv.total), inv.currency)}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/${role}/property-management/invoices/${inv.id}`}
                        >
                          Open
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming reminders</CardTitle>
            <CardDescription>Scheduled rent / lease alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingReminders.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No reminders scheduled.{" "}
                <Link
                  href={`/${role}/property-management/reminders`}
                  className="text-primary underline underline-offset-2"
                >
                  Create one
                </Link>
                .
              </div>
            ) : (
              <ul className="space-y-2">
                {stats.upcomingReminders.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {r.title}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(r.remind_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {r.kind.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
