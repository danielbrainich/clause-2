import { NextResponse } from "next/server";
import { loadStore } from "@/lib/ethicsCommitteeStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await loadStore();
    return NextResponse.json({
      ok: true,
      where: store.__backend,
      key: store.__key,
      total: store.map.size,
      lastUpdated: store.lastUpdated || null,
      sampleKeys: Array.from(store.map.keys()).slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
