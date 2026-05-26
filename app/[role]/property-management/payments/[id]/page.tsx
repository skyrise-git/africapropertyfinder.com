"use client";

import { ArrowLeft, Mail, Printer } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
  Tenant,
} from "@/lib/types/property-management.type";
import { formatMoney } from "@/lib/utils/money";

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  const id = params.id as string;
  const { user } = useAppStore();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const p = await paymentService.getById(id);
      if (!p) {
        setLoadError("Receipt not found or you don't have access.");
        return;
      }
      setPayment(p);
      const promises: Promise<unknown>[] = [];
      if (p.tenantId)
        promises.push(tenantService.getById(p.tenantId).then(setTenant));
      if (p.invoiceId)
        promises.push(invoiceService.getById(p.invoiceId).then(setInvoice));
      if (p.propertyId)
        promises.push(propertyService.getById(p.propertyId).then(setProperty));
      await Promise.all(promises);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function emailReceipt() {
    if (!payment || !tenant?.email) {
      toast.error(
        tenant ? "Tenant has no email on file" : "Tenant info missing",
      );
      return;
    }
    const subject = `Receipt ${payment.receipt_number} — ${formatMoney(Number(payment.amount), payment.currency)}`;
    const body = [
      `Hello ${tenant.name},`,
      "",
      "This confirms we received your payment.",
      `Receipt: ${payment.receipt_number}`,
      `Date: ${payment.paid_on}`,
      `Method: ${payment.method.replace("_", " ")}`,
      `Amount: ${formatMoney(Number(payment.amount), payment.currency)}`,
      invoice ? `For invoice: ${invoice.invoice_number}` : "",
      payment.reference ? `Reference: ${payment.reference}` : "",
      "",
      "Thank you.",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await pmMessageService.log({
        ownerId: user?.uid,
        tenantId: tenant.id,
        invoiceId: payment.invoiceId,
        paymentId: payment.id,
        kind: "receipt",
        channel: "email",
        recipient: tenant.email,
        subject,
        body,
        status: "queued",
      });
      toast.success("Receipt queued for delivery", {
        action: {
          label: "Open mail app",
          onClick: () => {
            window.location.href = `mailto:${tenant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          },
        },
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to queue receipt",
      );
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (loadError || !payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Couldn't load receipt</CardTitle>
          <CardDescription>{loadError ?? "Receipt not found."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => load()}>
            Retry
          </Button>
          <Button asChild size="sm">
            <Link href={`/${role}/property-management/payments`}>
              Back to payments
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
          <Link href={`/${role}/property-management/payments`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to payments
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 size-4" />
            Print / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={emailReceipt}>
            <Mail className="mr-2 size-4" />
            Email receipt
          </Button>
        </div>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle className="font-light text-2xl tracking-tight">
            Receipt {payment.receipt_number}
          </CardTitle>
          <CardDescription>Issued on {payment.paid_on}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-muted-foreground text-xs uppercase tracking-wide">
                Received from
              </h3>
              <div className="font-medium">{tenant?.name ?? "—"}</div>
              {tenant?.email ? (
                <div className="text-sm text-muted-foreground">
                  {tenant.email}
                </div>
              ) : null}
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs uppercase tracking-wide">
                Property
              </h3>
              <div className="font-medium">{property?.title ?? "—"}</div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Amount paid">
                <span className="text-2xl font-light tabular-nums text-emerald-600">
                  {formatMoney(Number(payment.amount), payment.currency)}
                </span>
              </Field>
              <Field label="Method">
                <span className="capitalize">
                  {payment.method.replace("_", " ")}
                </span>
              </Field>
              <Field label="Reference">{payment.reference ?? "—"}</Field>
              <Field label="For invoice">
                {invoice ? (
                  <Link
                    href={`/${role}/property-management/invoices/${invoice.id}`}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {invoice.invoice_number}
                  </Link>
                ) : (
                  "—"
                )}
              </Field>
            </div>
          </div>

          {payment.notes ? (
            <div>
              <h3 className="text-muted-foreground text-xs uppercase tracking-wide">
                Notes
              </h3>
              <p className="text-sm">{payment.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
