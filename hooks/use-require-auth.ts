import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/hooks/use-app-store";

/**
 * Requires authentication for a page. Shows a toast and redirects to signin if user is not logged in.
 * @param toastMessage - Custom message to show in toast (default: "Please sign in to continue")
 * @returns boolean indicating if user is authenticated
 */
export function useRequireAuth(toastMessage: string = "Please sign in to continue") {
  const router = useRouter();
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      toast.error(toastMessage);
      // Small delay to ensure toast is visible before redirect
      const timer = setTimeout(() => {
        router.replace("/signin");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, router, toastMessage]);

  return !!user;
}

