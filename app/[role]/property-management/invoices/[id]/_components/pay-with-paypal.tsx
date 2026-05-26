"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  invoiceId: string;
  amount: number;
  currency: string;
}

interface CreateOrderResponse {
  orderId: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

export function PayWithPaypalButton({ invoiceId }: Props) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const here = new URL(window.location.href);
      const returnUrl = `${here.origin}${here.pathname}?paypal_return=1&invoice=${invoiceId}`;
      const cancelUrl = `${here.origin}${here.pathname}?paypal_cancel=1`;
      const resp = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, returnUrl, cancelUrl }),
      });
      const data = (await resp.json()) as CreateOrderResponse & {
        error?: string;
      };
      if (!resp.ok) {
        toast.error(data.error ?? `PayPal error (${resp.status})`);
        return;
      }
      const approve = data.links?.find((l) => l.rel === "approve");
      if (!approve) {
        toast.error("PayPal didn't return an approval link");
        return;
      }
      window.location.href = approve.href;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start PayPal",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={start} disabled={loading}>
      {loading ? "Starting…" : "Pay with PayPal"}
    </Button>
  );
}
