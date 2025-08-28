import { NextResponse } from "next/server";
import committeeData from "@/data/ethics-committee.json"; // bundled at build

export async function GET(req) {
  try {
    // Open Netlify Blobs store
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("ethics-committee");

    // Handle both shapes:
    // - Entire object is the flat map of bills (keys like "111:HRES:..."),
    // - Or { map: { ... } }
    const imported = committeeData;
    const map = (imported && typeof imported === "object" && imported.map && typeof imported.map === "object")
      ? imported.map
      : imported;

    if (!map || typeof map !== "object") {
      return NextResponse.json({ ok: false, error: "Bad data shape in ethics-committee.json" }, { status: 400 });
    }

    const keys = Object.keys(map);
    const total = keys.length;
    const sampleKeys = keys.slice(0, 5);

    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get("confirm") === "1";

    if (!confirm) {
      // Dry run — show what would be written
      return NextResponse.json({
        ok: true,
        dryRun: true,
        total,
        sampleKeys,
        hint: "Add ?confirm=1 to write to Netlify Blobs"
      });
    }

    // Write canonical shape expected by readers: { lastUpdated, map }
    const payload = { lastUpdated: Date.now(), map };
    await store.setJSON("store.json", payload, {
      metadata: { lastUpdated: String(payload.lastUpdated) }
    });

    return NextResponse.json({
      ok: true,
      written: true,
      total,
      sampleKeys
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
