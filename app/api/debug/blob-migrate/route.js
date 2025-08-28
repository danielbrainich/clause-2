import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getStore } = await import("@netlify/blobs");
    // Same store/key you’re already using in prod
    const store = getStore("ethics-committee");
    const json = await store.get("store.json", { type: "json" });

    if (!json) {
      return NextResponse.json({ ok: true, action: "none", reason: "no store.json" });
    }

    // If blob was saved as { map: { items: {...} } }, flatten it
    const hadItems = json?.map?.items && typeof json.map.items === "object";
    const fixed = {
      lastUpdated: json?.lastUpdated || Date.now(),
      map: hadItems ? json.map.items : (json.map || {}),
    };

    if (hadItems) {
      await store.setJSON("store.json", fixed, {
        metadata: { lastUpdated: String(fixed.lastUpdated) },
      });
    }

    const totalKeys = Object.keys(fixed.map || {}).length;
    const sampleKeys = Object.keys(fixed.map || {}).slice(0, 5);

    return NextResponse.json({
      ok: true,
      migrated: !!hadItems,
      totalKeys,
      sampleKeys,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
