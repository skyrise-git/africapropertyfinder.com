import { NextResponse } from "next/server";
import { paypalVerifyWebhook } from "@/lib/server/paypal";
import { getServiceClient } from "@/lib/server/pm-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers: Record<string, string | undefined> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const verified = await paypalVerifyWebhook({ headers, rawBody }).catch(
    () => false,
  );

  const sb = getServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = sb as any;

  const eventId = (payload.id as string) || null;
  const eventType = (payload.event_type as string) || null;

  // Idempotent insert; unique on provider_event_id.
  const { error } = await db.from("pm_payment_events").insert({
    provider: "paypal",
    provider_event_id: eventId,
    event_type: eventType,
    payload,
    processed: false,
    error: verified ? null : "signature verification failed",
  });
  // Conflict on duplicate event id: that's fine, we already have it.
  if (error && !error.message?.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!verified) {
    return NextResponse.json({ ok: true, verified: false });
  }
  return NextResponse.json({ ok: true });
}
