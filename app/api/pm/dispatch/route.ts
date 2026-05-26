import { NextResponse } from "next/server";
import { runDispatch } from "@/lib/server/pm-dispatch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  // Vercel Cron sets the request with `Authorization: Bearer <CRON_SECRET>`
  // when the project has CRON_SECRET defined; we accept the same header for
  // any external scheduler.
  return token === expected;
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}

async function handler(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDispatch();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "dispatch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
