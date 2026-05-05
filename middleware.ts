import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED = new Set(["ZA", "ZW"]);
const COOKIE_NAME = "apf_geo_country";

/**
 * Detects the visitor's country from edge-provided headers (Vercel / Cloudflare)
 * and persists it in a long-lived cookie. Client code uses this cookie to set the
 * default country on first load. Users can override via the navbar switcher; that
 * choice is stored in localStorage and takes precedence.
 */
export function middleware(req: NextRequest) {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing) return NextResponse.next();

  const headerCountry =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country-code") ||
    "";

  const code = headerCountry.toUpperCase();
  const resolved = SUPPORTED.has(code) ? code : "ZA";

  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, resolved, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: [
    // Run on every page request except static assets and API routes
    "/((?!_next/|api/|.*\\..*).*)",
  ],
};
