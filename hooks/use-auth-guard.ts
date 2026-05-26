import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/hooks/use-app-store";

/**
 * Redirects authenticated users away from specified paths (e.g., signin,
 * signup). Honors a `?redirect=<path>` query param so users return to the
 * page they were trying to reach before being bounced to /signin. Reads the
 * query string from `window.location` to avoid forcing the consumer (the
 * top-level SupabaseProvider) into a Suspense boundary at build time.
 * @param redirectPaths - Array of paths to redirect from when authenticated
 */
export function useAuthGuard(redirectPaths: string[] = ["/login"]) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    if (redirectPaths.includes(pathname)) {
      let redirect: string | null = null;
      if (typeof window !== "undefined") {
        try {
          redirect = new URLSearchParams(window.location.search).get(
            "redirect",
          );
        } catch {
          redirect = null;
        }
      }
      if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
        router.replace(redirect);
        return;
      }
      if (
        user.role === "admin" ||
        user.role === "staff" ||
        user.role === "agent"
      ) {
        router.replace(`/${user.role}/dashboard`);
      }
      if (user.role === "user") router.replace(`/`);
    }
  }, [user, pathname, router, redirectPaths]);
}
