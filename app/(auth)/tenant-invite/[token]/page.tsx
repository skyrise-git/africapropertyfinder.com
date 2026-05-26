"use client";

import { CheckCircle2, MailCheck } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { useAppStore } from "@/hooks/use-app-store";
import { tenantService } from "@/lib/services/property-management.service";
import { createClient } from "@/lib/supabase/client";

type Phase = "loading" | "needs-auth" | "accepting" | "done" | "error";

export default function TenantInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const user = useAppStore((s) => s.user);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  const handleAccept = useCallback(async () => {
    setPhase("accepting");
    try {
      await tenantService.acceptInvite(token);
      setPhase("done");
      toast.success("You're linked. Welcome to your tenant portal.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invite failed";
      setError(msg);
      setPhase("error");
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setPhase("needs-auth");
        return;
      }
      // session exists; if user is hydrated in the store we can accept directly
      if (user) {
        await handleAccept();
      } else {
        // wait briefly for the store to hydrate
        setPhase("loading");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, handleAccept]);

  // Once user finishes hydrating, kick acceptance.
  useEffect(() => {
    if (phase === "loading" && user) {
      handleAccept();
    }
  }, [user, phase, handleAccept]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="size-6 text-primary" />
          </div>
          <CardTitle className="font-light tracking-tight">
            Tenant invite
          </CardTitle>
          <CardDescription>
            Link your account to your lease to view invoices, receipts, and
            maintenance requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {phase === "loading" || phase === "accepting" ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <Spinner className="size-6" />
              <p className="text-sm text-muted-foreground">
                {phase === "accepting"
                  ? "Linking your account…"
                  : "Checking session…"}
              </p>
            </div>
          ) : phase === "needs-auth" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in or create an account to accept this invite. Use the same
                email your landlord/agent has on file when possible.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild>
                  <Link
                    href={`/signin?redirect=/tenant-invite/${encodeURIComponent(token)}`}
                  >
                    Sign in
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={`/signup?redirect=/tenant-invite/${encodeURIComponent(token)}`}
                  >
                    Create account
                  </Link>
                </Button>
              </div>
            </>
          ) : phase === "done" ? (
            <div className="space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm">
                Account linked. Open your tenant portal to see your lease,
                invoices, and receipts.
              </p>
              <Button onClick={() => router.replace("/tenant")}>
                Go to my portal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                {error ?? "Something went wrong with this invite."}
              </p>
              <Button asChild variant="outline">
                <Link href="/">Back home</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
