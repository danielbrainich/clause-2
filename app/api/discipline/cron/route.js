import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const origin = new URL(req.url).origin;
    // 2-day window for safety; small page/limit = quick
    const r = await fetch(
      `${origin}/api/discipline/refresh?days=2&limit=200&pages=4&strict=1`,
      { cache: "no-store" }
    );
    const json = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: true, via: "cron", status: r.status, json });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
