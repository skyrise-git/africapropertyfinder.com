"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useAppStore } from "@/hooks/use-app-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Client guard for /[role]/* routes. Redirects unauthenticated users to
 * /signin with a redirect param, and bounces users whose role does not match
 * the URL segment to the appropriate dashboard. Renders a spinner while the
 * session check is in flight to avoid flashing the empty agent panel.
 */
export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const urlRole = (params?.role as string) ?? "";
  const user = useAppStore((s) => s.user);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        toast.error("Please sign in to continue");
        const target = pathname
          ? `/signin?redirect=${encodeURIComponent(pathname)}`
          : "/signin";
        router.replace(target);
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // Once the supabase provider has hydrated the user, check role-vs-URL.
  useEffect(() => {
    if (!checked || !user) return;
    const validRoles = ["admin", "staff", "agent", "user"] as const;
    if (!validRoles.includes(urlRole as (typeof validRoles)[number])) return;

    if (user.role !== urlRole) {
      // Allow admins/staff to access any role panel; otherwise bounce to their own.
      if (user.role === "admin" || user.role === "staff") return;
      const target =
        user.role === "agent"
          ? "/agent/dashboard"
          : user.role === "user"
            ? "/"
            : "/";
      toast.error("You don't have access to that area");
      router.replace(target);
    }
  }, [checked, user, urlRole, router]);

  if (!checked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }
  return <>{children}</>;
}
