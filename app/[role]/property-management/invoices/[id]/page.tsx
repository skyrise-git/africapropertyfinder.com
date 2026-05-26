"use client";

import { ArrowLeft, Download, Mail, Plus, Printer, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  invoiceService,
  paymentService,
  pmMessageService,
  tenantService,
} from "@/lib/services/property-management.service";
import type { Property } from "@/lib/types/property.type";
import type {
  Invoice,
  Payment,
  PaymentMethod,
  Tenant,
} from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";
import { PayWithPaypalButton } from "./_components/pay-with-paypal";

const statusVariant: Record<
  Invoice["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  sent: "secondary",
  partial: "secondary",
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  const id = params.id as string;
  const { user } = useAppStore();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [recordOpen, setRecordOpen] = useState(false);
  const [pay, setPay] = useState<{
    paid_on: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
    notes: string;
  }>({
    paid_on: new Date().toISOString().slice(0, 10),
    amount: 0,
    method: "eft",
    reference: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const inv = await invoiceService.getById(id);
      if (!inv) {
        setLoadError("Invoice not found or you don't have access.");
        return;
      }
      const [pays, t, p] = await Promise.all([
        paymentService.getByInvoiceId(id),
        tenantService.getById(inv.tenantId),
        propertyService.getById(inv.propertyId),
      ]);
      setInvoice(inv);
      setPayments(pays);
      setTenant(t);
      setProperty(p);
      setPay((prev) => ({
        ...prev,
        amount: Math.max(
          0,
          Number(inv.total) -
            pays.reduce((s, x) => s + Number(x.amount ?? 0), 0),
        ),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const searchParams = useSearchParams();
  const captureRan = useRef(false);
  useEffect(() => {
    if (captureRan.current) return;
    const isReturn = searchParams.get("paypal_return") === "1";
    const orderId = searchParams.get("token");
    if (!isReturn || !orderId) return;
    captureRan.current = true;
    (async () => {
      try {
        const resp = await fetch("/api/payments/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const json = (await resp.json()) as { error?: string };
        if (!resp.ok) {
          toast.error(json.error ?? "PayPal capture failed");
          return;
        }
        toast.success("Payment received");
        load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Capture failed");
      }
    })();
  }, [searchParams, load]);

  const totals = useMemo(() => {
    if (!invoice) return { paid: 0, balance: 0 };
    const paid = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    return { paid, balance: Number(invoice.total) - paid };
  }, [invoice, payments]);

  async function markSent() {
    if (!invoice) return;
    try {
      await invoiceService.markSent(invoice.id);
      toast.success("Invoice marked as sent");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function recordPayment() {
    if (!invoice) return;
    if (!pay.amount || pay.amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    try {
      const paymentId = await paymentService.create({
        ownerId: user?.uid,
        invoiceId: invoice.id,
        leaseId: invoice.leaseId,
        tenantId: invoice.tenantId,
        propertyId: invoice.propertyId,
        amount: Number(pay.amount),
        currency: invoice.currency,
        method: pay.method,
        paid_on: pay.paid_on,
        reference: pay.reference || undefined,
        notes: pay.notes || undefined,
      });
      toast.success("Payment recorded");
      setRecordOpen(false);

      if (tenant?.email) {
        await pmMessageService
          .log({
            ownerId: user?.uid,
            tenantId: tenant.id,
            invoiceId: invoice.id,
            paymentId,
            kind: "receipt",
            channel: "email",
            recipient: tenant.email,
            subject: `Receipt for ${invoice.invoice_number}`,
            body: `Thanks. We received ${formatMoney(Number(pay.amount), invoice.currency)} on ${pay.paid_on}.`,
            status: "queued",
          })
          .catch(() => undefined);
      }
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function sendByEmail() {
    if (!invoice || !tenant?.email) {
      toast.error(
        tenant ? "Tenant has no email on file" : "Tenant info missing",
      );
      return;
    }
    const subject = `Invoice ${invoice.invoice_number} — ${formatMoney(Number(invoice.total), invoice.currency)}`;
    const body = [
      `Hello ${tenant.name},`,
      "",
      "Please find your invoice details below.",
      `Invoice: ${invoice.invoice_number}`,
      `Issue date: ${invoice.issue_date}`,
      `Due date: ${invoice.due_date}`,
      `Amount: ${formatMoney(Number(invoice.amount), invoice.currency)}`,
      `Tax: ${formatMoney(Number(invoice.tax), invoice.currency)}`,
      `Total: ${formatMoney(Number(invoice.total), invoice.currency)}`,
      invoice.notes ? `\nNotes: ${invoice.notes}` : "",
      "",
      "Thank you.",
    ].join("\n");
    try {
      await pmMessageService.log({
        ownerId: user?.uid,
        tenantId: tenant.id,
        invoiceId: invoice.id,
        kind: "invoice",
        channel: "email",
        recipient: tenant.email,
        subject,
        body,
        status: "queued",
      });
      toast.success("Invoice queued for delivery", {
        action: {
          label: "Open mail app",
          onClick: () => {
            window.location.href = `mailto:${tenant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          },
        },
      });
      await invoiceService.markSent(invoice.id);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to queue email");
    }
  }

  function downloadPdf() {
    window.print();
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (loadError || !invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Couldn't load invoice</CardTitle>
          <CardDescription>{loadError ?? "Invoice not found."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => load()}>
            Retry
          </Button>
          <Button asChild size="sm">
            <Link href={`/${role}/property-management/invoices`}>
              Back to invoices
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${role}/property-management/invoices`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to invoices
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Printer className="mr-2 size-4" />
            Print / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={sendByEmail}>
            <Mail className="mr-2 size-4" />
            Send by email
          </Button>
          {invoice.status === "draft" ? (
            <Button size="sm" onClick={markSent}>
              <Send className="mr-2 size-4" />
              Mark sent
            </Button>
          ) : null}
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="mr-2 size-4" />
            Record payment
          </Button>
          {totals.balance > 0 ? (
            <PayWithPaypalButton
              invoiceId={invoice.id}
              amount={totals.balance}
              currency={invoice.currency}
            />
          ) : null}
        </div>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-light text-2xl tracking-tight">
                Invoice {invoice.invoice_number}
              </CardTitle>
              <CardDescription>
                Issued {invoice.issue_date} · Due {invoice.due_date}
              </CardDescription>
            </div>
            <Badge variant={statusVariant[invoice.status]}>
              {invoice.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-muted-foreground text-xs uppercase tracking-wide">
                Bill to
              </h3>
              <div className="font-medium">{tenant?.name ?? "—"}</div>
              {tenant?.email ? (
                <div className="text-sm text-muted-foreground">
                  {tenant.email}
                </div>
              ) : null}
              {tenant?.phone ? (
                <div className="text-sm text-muted-foreground">
                  {tenant.phone}
                </div>
              ) : null}
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs uppercase tracking-wide">
                Property
              </h3>
              <div className="font-medium">{property?.title ?? "—"}</div>
              {property ? (
                <div className="text-sm text-muted-foreground">
                  {property.address}, {property.city}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="capitalize">
                    {invoice.kind.replace("_", " ")}
                    {invoice.notes ? (
                      <div className="text-muted-foreground text-xs">
                        {invoice.notes}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invoice.period_start ?? "—"} → {invoice.period_end ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(invoice.amount), invoice.currency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rent</span>
                <span className="tabular-nums">
                  {formatMoney(Number(invoice.amount), invoice.currency)}
                </span>
              </div>
              {Number(invoice.tax) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">
                    {formatMoney(Number(invoice.tax), invoice.currency)}
                  </span>
                </div>
              ) : null}
              {invoice.platform_fee_bearer === "tenant" &&
              Number(invoice.platform_fee_amount ?? 0) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Platform service fee
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(
                      Number(invoice.platform_fee_amount),
                      invoice.currency,
                    )}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total due</span>
                <span className="tabular-nums">
                  {formatMoney(Number(invoice.total), invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Paid</span>
                <span className="tabular-nums">
                  {formatMoney(totals.paid, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-medium">
                <span>Balance</span>
                <span className="tabular-nums">
                  {formatMoney(totals.balance, invoice.currency)}
                </span>
              </div>
              {/* Owner-side disclosure: fee absorbed when bearer = owner */}
              {invoice.platform_fee_bearer === "owner" &&
              Number(invoice.platform_fee_amount ?? 0) > 0 ? (
                <div className="mt-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Platform fee (deducted from your net)</span>
                    <span className="tabular-nums">
                      {formatMoney(
                        Number(invoice.platform_fee_amount),
                        invoice.currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Owner net</span>
                    <span className="tabular-nums">
                      {formatMoney(
                        Number(invoice.owner_net_amount ?? 0),
                        invoice.currency,
                      )}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
          <CardDescription>
            Receipts auto-generated for each payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link
                          className="underline-offset-2 hover:underline"
                          href={`/${role}/property-management/payments/${p.id}`}
                        >
                          {p.receipt_number}
                        </Link>
                      </TableCell>
                      <TableCell>{p.paid_on}</TableCell>
                      <TableCell className="capitalize">
                        {p.method.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.reference ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(p.amount), p.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/${role}/property-management/payments/${p.id}`}
                          >
                            <Download className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Outstanding balance:{" "}
              {formatMoney(totals.balance, invoice.currency)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="paid_on">Paid on</Label>
              <Input
                id="paid_on"
                type="date"
                value={pay.paid_on}
                onChange={(e) =>
                  setPay((p) => ({ ...p, paid_on: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={pay.amount}
                onChange={(e) =>
                  setPay((p) => ({ ...p, amount: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label htmlFor="method">Method</Label>
              <Select
                value={pay.method}
                onValueChange={(v) =>
                  setPay((p) => ({ ...p, method: v as PaymentMethod }))
                }
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="eft">EFT / Bank transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                value={pay.reference}
                onChange={(e) =>
                  setPay((p) => ({ ...p, reference: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={pay.notes}
                onChange={(e) =>
                  setPay((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={recordPayment}>Record payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
