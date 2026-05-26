import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/hooks/use-app-store";

/**
 * Requires authentication for a page. Shows a toast and redirects to /signin
 * with a redirect query param so users return to the page they meant to visit.
 * @param toastMessage - Custom message to show in toast (default: "Please sign in to continue")
 * @returns boolean indicating if user is authenticated
 */
export function useRequireAuth(
  toastMessage: string = "Please sign in to continue",
) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      toast.error(toastMessage);
      const target =
        pathname && pathname !== "/signin"
          ? `/signin?redirect=${encodeURIComponent(pathname)}`
          : "/signin";
      const timer = setTimeout(() => {
        router.replace(target);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, router, toastMessage, pathname]);

  return !!user;
}
