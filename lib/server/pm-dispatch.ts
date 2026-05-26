import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only helpers for the property management dispatch pipeline. The
 * worker runs against the service-role key so it can operate across all
 * tenants and update message statuses regardless of RLS.
 */

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "PM dispatch is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface QueuedMessage {
  id: string;
  channel: "email" | "sms" | "in_app";
  recipient: string;
  subject?: string | null;
  body?: string | null;
  attempt_count?: number | null;
}

/**
 * Send one outbound message. Currently supports email via Resend
 * (https://resend.com). When RESEND_API_KEY is missing, the worker runs in
 * "log only" mode: messages are flipped to sent without an external call so
 * the rest of the pipeline can be developed locally. SMS is reserved for a
 * future phase and currently flips to failed with a clear reason.
 */
async function deliver(msg: QueuedMessage): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (msg.channel === "in_app") {
    return { ok: true };
  }
  if (msg.channel === "sms") {
    return { ok: false, error: "SMS provider not configured" };
  }
  if (msg.channel !== "email") {
    return { ok: false, error: `unknown channel ${msg.channel}` };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    // Dev / log-only mode.
    return { ok: true };
  }
  if (!msg.recipient) {
    return { ok: false, error: "missing recipient" };
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [msg.recipient],
        subject: msg.subject || "Notification",
        text: msg.body || "",
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return {
        ok: false,
        error: `resend ${resp.status}: ${text.slice(0, 200)}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

interface RunResult {
  scheduledRefresh: number;
  remindersEnqueued: number;
  messagesSent: number;
  messagesFailed: number;
}

/**
 * Run a full dispatch pass: refresh overdue invoices, enqueue due reminders,
 * deliver queued messages.
 */
export async function runDispatch(): Promise<RunResult> {
  const sb = getServiceClient();

  // 1) Refresh overdue invoice status.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overdueRes = await (sb as any).rpc("pm_refresh_overdue");
  const scheduledRefresh =
    typeof overdueRes.data === "number" ? overdueRes.data : 0;

  // 2) Enqueue due reminders.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remindRes = await (sb as any).rpc("pm_dispatch_due_reminders");
  const remindersEnqueued =
    typeof remindRes.data === "number" ? remindRes.data : 0;

  // 3) Deliver queued messages, batched.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queueRes = await (sb as any)
    .from("pm_messages")
    .select("*")
    .eq("status", "queued")
    .limit(50);

  let messagesSent = 0;
  let messagesFailed = 0;
  const queue = (queueRes.data ?? []) as QueuedMessage[];
  for (const msg of queue) {
    const nextAttempt = (msg.attempt_count ?? 0) + 1;
    const result = await deliver(msg);
    if (result.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any)
        .from("pm_messages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempt_count: nextAttempt,
          last_attempted_at: new Date().toISOString(),
          error: null,
        })
        .eq("id", msg.id);
      messagesSent++;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any)
        .from("pm_messages")
        .update({
          status: "failed",
          attempt_count: nextAttempt,
          last_attempted_at: new Date().toISOString(),
          error: result.error ?? "unknown",
        })
        .eq("id", msg.id);
      messagesFailed++;
    }
  }

  return { scheduledRefresh, remindersEnqueued, messagesSent, messagesFailed };
}
