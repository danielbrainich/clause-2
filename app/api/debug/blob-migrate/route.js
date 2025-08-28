import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.NETLIFY) {
    return NextResponse.json({ ok: false, note: "Not on Netlify (no NETLIFY env)." }, { status: 400 });
  }
  try {
    const { getStore } = await import("@netlify/blobs");
    const s = getStore("ethics-committee");
    const json = await s.get("store.json", { type: "json" });

    if (!json) {
      return NextResponse.json({ ok: true, action: "none", reason: "No store.json yet." });
    }

    const hadItems = !!json?.map?.items;
    const fixed = {
      lastUpdated: json?.lastUpdated || Date.now(),
      map: hadItems ? json.map.items : (json.map || {}),
    };

    if (hadItems) {
      await s.setJSON("store.json", fixed, {
        metadata: { lastUpdated: String(fixed.lastUpdated) },
      });
    }

    const sampleKeys = Object.keys(fixed.map || {}).slice(0, 5);

    return NextResponse.json({
      ok: true,
      migrated: hadItems,
      totalKeys: Object.keys(fixed.map || {}).length,
      sampleKeys,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
