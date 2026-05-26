import { NextResponse } from "next/server";
import { isPaypalConfigured, paypalCreateOrder } from "@/lib/server/paypal";
import { getServiceClient } from "@/lib/server/pm-dispatch";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isPaypalConfigured()) {
    return NextResponse.json(
      { error: "PayPal not configured on server" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    invoiceId?: string;
    returnUrl?: string;
    cancelUrl?: string;
  };
  if (!body.invoiceId) {
    return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
  }

  // Authenticate the caller via SSR cookies; for tenant payments this is the
  // tenant; admins/staff also allowed.
  const userClient = await createServerClient();
  const { data: auth } = await userClient.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Use service-role for fee-aware reads so tenant invoices are visible even
  // before RLS allows (tenants can also read via the Phase 4 policy, but this
  // path stays consistent across owners/admins/tenants).
  const sb = getServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = sb as any;

  const { data: inv, error: invErr } = await db
    .from("pm_invoices")
    .select("*")
    .eq("id", body.invoiceId)
    .maybeSingle();
  if (invErr || !inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (inv.status === "paid" || inv.status === "cancelled") {
    return NextResponse.json(
      { error: `Invoice is ${inv.status}` },
      { status: 400 },
    );
  }

  // Sum existing payments to determine remaining balance.
  const { data: paid } = await db
    .from("pm_payments")
    .select("amount")
    .eq("invoiceId", inv.id);
  const paidTotal = (paid ?? []).reduce(
    (s: number, r: { amount: number | string }) => s + Number(r.amount ?? 0),
    0,
  );
  const balance = Math.max(0, Number(inv.total) - paidTotal);
  if (balance <= 0) {
    return NextResponse.json({ error: "Nothing due" }, { status: 400 });
  }

  let order: Awaited<ReturnType<typeof paypalCreateOrder>>;
  try {
    order = await paypalCreateOrder({
      amount: balance,
      currency: inv.currency || "USD",
      invoiceNumber: inv.invoice_number,
      description: `Invoice ${inv.invoice_number}`,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 },
    );
  }

  // Record the payment intent for audit + reconciliation.
  await db.from("pm_payment_intents").insert({
    ownerId: inv.ownerId,
    invoiceId: inv.id,
    provider: "paypal",
    provider_order_id: order.id,
    amount: balance,
    currency: inv.currency || "USD",
    platform_fee_amount: inv.platform_fee_amount ?? 0,
    platform_fee_bearer: inv.platform_fee_bearer ?? "owner",
    status: "created",
  });

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    links: order.links ?? [],
    amount: balance,
    currency: inv.currency,
  });
}
