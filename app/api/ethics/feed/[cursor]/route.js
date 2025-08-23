import { NextResponse } from "next/server";
import { loadStore } from "@/lib/ethicsCommitteeStore";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { cursor } = params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 12), 50);
  const start = Number(cursor || 0) || 0;

  const store = await loadStore();
  const itemsObj =
    store?.items ||
    store?.map?.items ||   // legacy
    store?.map ||          // last-ditch legacy
    {};
  const all = Object.values(itemsObj);

  all.sort((a, b) => {
    const db = Date.parse(b?.latestAction?.actionDate || b?.committeeActionDate || b?.updateDate || 0) || 0;
    const da = Date.parse(a?.latestAction?.actionDate || a?.committeeActionDate || a?.updateDate || 0) || 0;
    return db - da;
  });

  const slice = all.slice(start, start + limit);
  const nextCursor = start + slice.length < all.length ? start + slice.length : null;

  return NextResponse.json({
    ok: true,
    total: all.length,
    nextCursor,
    items: slice,
  });
}
