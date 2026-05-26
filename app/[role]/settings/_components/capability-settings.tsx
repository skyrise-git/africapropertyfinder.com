"use client";

import { Building2, Home, ShoppingBag, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/hooks/use-app-store";
import { createClient } from "@/lib/supabase/client";
import {
  type CapabilityName,
  DEFAULT_CAPABILITIES,
  type UserCapabilities,
} from "@/lib/types/user.type";

const meta: Array<{
  key: CapabilityName;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    key: "canList",
    title: "List properties",
    description:
      "Create and manage property listings (sale, rent, student housing).",
    icon: Building2,
  },
  {
    key: "canBuy",
    title: "Buy / rent searches",
    description: "Save searches, favourite properties, and book viewings.",
    icon: ShoppingBag,
  },
  {
    key: "canManageProperty",
    title: "Manage properties",
    description:
      "Use the property management module: tenants, leases, rent collection, maintenance.",
    icon: Home,
  },
  {
    key: "canLeaseAsTenant",
    title: "Lease as tenant",
    description:
      "View your linked tenant portal: lease, invoices, receipts, and maintenance requests.",
    icon: Users,
  },
];

export function CapabilitySettings() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [caps, setCaps] = useState<UserCapabilities>(
    user?.capabilities ?? DEFAULT_CAPABILITIES,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.capabilities) setCaps(user.capabilities);
  }, [user?.capabilities]);

  const toggle = async (key: CapabilityName, value: boolean) => {
    if (!user) return;
    const prev = caps;
    const next: UserCapabilities = { ...caps, [key]: value };
    setCaps(next);
    setSaving(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ capabilities: next, updatedAt: new Date().toISOString() })
        .eq("id", user.uid);
      if (error) throw new Error(error.message);
      setUser({ ...user, capabilities: next });
      toast.success("Capabilities updated");
    } catch (err) {
      setCaps(prev);
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-light tracking-tight">
          Account capabilities
        </CardTitle>
        <CardDescription>
          One account, multiple personas. Toggle which parts of the platform you
          want available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {meta.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.key}
              className="flex items-start justify-between gap-4 rounded-md border p-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">{m.title}</div>
                  <p className="text-muted-foreground text-xs">
                    {m.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={Boolean(caps[m.key])}
                disabled={saving}
                onCheckedChange={(v) => toggle(m.key, v)}
                aria-label={m.title}
              />
            </div>
          );
        })}
        <p className="text-muted-foreground text-xs">
          Tip: capabilities are additive. Disabling one does not remove your
          existing data, but hides related actions in the UI.
        </p>
        <div>
          <Button variant="ghost" size="sm" disabled>
            {saving ? "Saving…" : "Saved"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
