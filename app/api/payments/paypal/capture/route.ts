import { NextResponse } from "next/server";
import { isPaypalConfigured, paypalCaptureOrder } from "@/lib/server/paypal";
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
  const body = (await req.json().catch(() => ({}))) as { orderId?: string };
  if (!body.orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const userClient = await createServerClient();
  const { data: auth } = await userClient.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = getServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = sb as any;

  const { data: intent, error: intentErr } = await db
    .from("pm_payment_intents")
    .select("*")
    .eq("provider_order_id", body.orderId)
    .maybeSingle();
  if (intentErr || !intent) {
    return NextResponse.json(
      { error: "Intent not found for that order" },
      { status: 404 },
    );
  }
  if (intent.status === "captured") {
    return NextResponse.json({ ok: true, status: "captured" });
  }

  let captureResp: Record<string, unknown>;
  try {
    captureResp = (await paypalCaptureOrder(body.orderId)) as Record<
      string,
      unknown
    >;
  } catch (err) {
    await db
      .from("pm_payment_intents")
      .update({
        status: "failed",
        raw_capture: { error: (err as Error).message },
        updatedAt: new Date().toISOString(),
      })
      .eq("id", intent.id);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 },
    );
  }

  // Pull capture id from response (PayPal v2 schema).
  const captureId =
    (((captureResp.purchase_units as Array<{
      payments?: { captures?: Array<{ id?: string }> };
    }>) ?? [])[0]?.payments?.captures ?? [])[0]?.id || null;

  // Pull the invoice for currency + ownership context.
  const { data: inv } = await db
    .from("pm_invoices")
    .select("*")
    .eq("id", intent.invoiceId)
    .maybeSingle();

  // Idempotency: do nothing if a payment with this captureId already exists.
  if (captureId) {
    const { data: existing } = await db
      .from("pm_payments")
      .select("id")
      .eq("reference", captureId)
      .maybeSingle();
    if (existing?.id) {
      await db
        .from("pm_payment_intents")
        .update({
          status: "captured",
          capture_id: captureId,
          raw_capture: captureResp,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", intent.id);
      return NextResponse.json({ ok: true, paymentId: existing.id });
    }
  }

  // Insert a payment row. The pm_payment_recompute trigger will mark the
  // invoice paid/partial automatically.
  const { data: paymentRow, error: payErr } = await db
    .from("pm_payments")
    .insert({
      ownerId: intent.ownerId ?? inv?.ownerId ?? null,
      invoiceId: intent.invoiceId,
      leaseId: inv?.leaseId,
      tenantId: inv?.tenantId,
      propertyId: inv?.propertyId,
      receipt_number: "",
      amount: Number(intent.amount),
      currency: intent.currency,
      method: "card",
      reference: captureId ?? body.orderId,
      notes: "PayPal capture",
    })
    .select("id")
    .single();
  if (payErr) {
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  // Update intent status.
  await db
    .from("pm_payment_intents")
    .update({
      status: "captured",
      capture_id: captureId,
      raw_capture: captureResp,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", intent.id);

  // Ledger lines:
  //   collection         += gross paid (positive)
  //   fee_revenue        += platform fee
  //   payable_to_owner   += owner_net (rent line)
  // Processor expense is recorded asynchronously when PayPal fees come back
  // via webhook; phase 1 leaves it at zero in the ledger and reconciles via
  // the manual payouts CSV.
  const fee = Number(intent.platform_fee_amount ?? 0);
  const ownerNet = Number(intent.amount) - fee;
  const ledgerRows = [
    {
      ownerId: intent.ownerId,
      invoiceId: intent.invoiceId,
      paymentId: paymentRow.id,
      intentId: intent.id,
      account: "collection",
      amount: Number(intent.amount),
      currency: intent.currency,
      memo: `PayPal capture ${captureId ?? body.orderId}`,
    },
    fee > 0
      ? {
          ownerId: intent.ownerId,
          invoiceId: intent.invoiceId,
          paymentId: paymentRow.id,
          intentId: intent.id,
          account: "fee_revenue",
          amount: fee,
          currency: intent.currency,
          memo: "Platform fee 0.5%",
        }
      : null,
    {
      ownerId: intent.ownerId,
      invoiceId: intent.invoiceId,
      paymentId: paymentRow.id,
      intentId: intent.id,
      account: "payable_to_owner",
      amount: ownerNet,
      currency: intent.currency,
      memo: "Owner net liability",
    },
  ].filter(Boolean);

  await db.from("pm_ledger_entries").insert(ledgerRows);

  return NextResponse.json({
    ok: true,
    paymentId: paymentRow.id,
    captureId,
  });
}
