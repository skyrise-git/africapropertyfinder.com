/**
 * Thin PayPal REST client. The collection model in phase 1 uses a single
 * PayPal Business account on the platform side: tenants pay into our account
 * and ops disburses to owners manually. Future phases can swap this for
 * marketplace split or move some flows server-side.
 */

const PAYPAL_BASE = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

export function getPaypalEnv() {
  return {
    base: PAYPAL_BASE,
    clientId: process.env.PAYPAL_CLIENT_ID,
    secret: process.env.PAYPAL_CLIENT_SECRET,
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
  };
}

export function isPaypalConfigured() {
  const env = getPaypalEnv();
  return Boolean(env.clientId && env.secret);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const env = getPaypalEnv();
  if (!env.clientId || !env.secret) {
    throw new Error("PayPal is not configured");
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.token;
  }
  const auth = Buffer.from(`${env.clientId}:${env.secret}`).toString("base64");
  const resp = await fetch(`${env.base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `PayPal auth failed (${resp.status}): ${text.slice(0, 200)}`,
    );
  }
  const json = (await resp.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 60) * 1000,
  };
  return cachedToken.token;
}

interface CreateOrderInput {
  amount: number;
  currency: string;
  invoiceNumber: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export async function paypalCreateOrder(input: CreateOrderInput) {
  const env = getPaypalEnv();
  const token = await getAccessToken();
  const resp = await fetch(`${env.base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          invoice_id: input.invoiceNumber,
          description: input.description?.slice(0, 127),
          amount: {
            currency_code: input.currency,
            value: input.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });
  const text = await resp.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!resp.ok) {
    throw new Error(
      `PayPal create-order failed (${resp.status}): ${text.slice(0, 200)}`,
    );
  }
  return json as {
    id: string;
    status: string;
    links?: Array<{ href: string; rel: string; method: string }>;
  };
}

export async function paypalCaptureOrder(orderId: string) {
  const env = getPaypalEnv();
  const token = await getAccessToken();
  const resp = await fetch(
    `${env.base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const text = await resp.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!resp.ok) {
    throw new Error(
      `PayPal capture failed (${resp.status}): ${text.slice(0, 200)}`,
    );
  }
  return json;
}

interface WebhookVerifyInput {
  headers: Record<string, string | undefined>;
  rawBody: string;
}

export async function paypalVerifyWebhook(
  input: WebhookVerifyInput,
): Promise<boolean> {
  const env = getPaypalEnv();
  if (!env.webhookId) {
    // If no webhook id is configured, treat verification as failed for safety.
    return false;
  }
  const token = await getAccessToken();
  const headers = input.headers;
  const resp = await fetch(
    `${env.base}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: env.webhookId,
        webhook_event: JSON.parse(input.rawBody),
      }),
    },
  );
  if (!resp.ok) return false;
  const json = (await resp.json()) as { verification_status?: string };
  return json.verification_status === "SUCCESS";
}
