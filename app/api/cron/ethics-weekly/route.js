import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const secret = process.env.CRON_SECRET || "";
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || req.headers.get("x-cron-secret");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  if (secret && !isVercelCron && token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const host = req.headers.get("host");
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "http://localhost:3000");

  const refreshUrl = new URL("/api/ethics/refresh", base);
  refreshUrl.searchParams.set("days", "365");  // 1 year
  refreshUrl.searchParams.set("limit", "200");
  refreshUrl.searchParams.set("pages", "40");
  refreshUrl.searchParams.set("confirm", "1"); // verify via committees
  refreshUrl.searchParams.set("wide", "1");    // allow 365d cap
  try {
    const r = await fetch(refreshUrl.toString(), { cache: "no-store" });
    const upstream = await r.json().catch(() => ({}));
    return NextResponse.json(
      { ok: r.ok, ran: "ethics-refresh-weekly", params: Object.fromEntries(refreshUrl.searchParams), upstream },
      { status: r.ok ? 200 : r.status }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
