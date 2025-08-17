import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.CONGRESS_GOV_API_KEY || "";
  if (!key) {
    return NextResponse.json(
      { ok: false, why: "Missing CONGRESS_GOV_API_KEY" },
      { status: 500 }
    );
  }
  const url = `https://api.congress.gov/v3/bill?api_key=${key}&format=json&limit=1`;
  const r = await fetch(url, { cache: "no-store" });
  const text = await r.text(); // show upstream response even if not JSON
  return NextResponse.json({
    ok: r.ok,
    status: r.status,
    sample: text.slice(0, 500),
  });
}
