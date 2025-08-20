import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const secret = process.env.CRON_SECRET || "";
  const url = new URL(req.url);

  // Allow either ?token=... or header x-cron-secret: ...
  const token = url.searchParams.get("token") || req.headers.get("x-cron-secret");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  // Require secret unless it's Vercel Cron
  if (secret && !isVercelCron && token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Build absolute base for internal fetch
  const host = req.headers.get("host");
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "http://localhost:3000");

  // DAILY REFRESH: small window on weekdays, deeper scan on Sundays
  const now = new Date();
  const isSundayUTC = now.getUTCDay() === 0;

  const days  = url.searchParams.get("days")  ?? (isSundayUTC ? "90"  : "3");
  const limit = url.searchParams.get("limit") ?? "250";
  const pages = url.searchParams.get("pages") ?? "40";
  const wide  = url.searchParams.get("wide")  ?? "1";
  const dry   = url.searchParams.get("dry") === "1"; // dry-run? (don’t persist)

  const refreshUrl = new URL("/api/ethics/refresh", base);
  refreshUrl.searchParams.set("days", days);
  refreshUrl.searchParams.set("limit", limit);
  refreshUrl.searchParams.set("pages", pages);
  refreshUrl.searchParams.set("wide", wide);
  refreshUrl.searchParams.set("confirm", dry ? "0" : "1"); // save unless dry=1
  if (url.searchParams.get("log") === "1") refreshUrl.searchParams.set("log", "1");

  // Add a timeout so the cron never hangs forever
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 25_000);

  try {
    const r = await fetch(refreshUrl.toString(), { cache: "no-store", signal: ac.signal });
    clearTimeout(t);
    const upstream = await r.json().catch(() => ({}));
    return NextResponse.json(
      {
        ok: r.ok,
        ran: "ethics-refresh-daily",
        params: Object.fromEntries(refreshUrl.searchParams),
        upstream,
      },
      { status: r.ok ? 200 : r.status }
    );
  } catch (e) {
    clearTimeout(t);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
