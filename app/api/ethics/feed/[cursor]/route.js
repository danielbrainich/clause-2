import { NextResponse } from "next/server";
import { loadStore } from "@/lib/ethicsCommitteeStore";

export async function GET(req, { params }) {
  const { cursor } = params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 12);

  const store = await loadStore();
  const all = Array.from(store.map.values());

  // Sort newest first by: latestAction.actionDate, then committeeActionDate, then updateDate
  all.sort((a, b) => {
    const ad = a?.latestAction?.actionDate || a?.committeeActionDate || a?.updateDate || "";
    const bd = b?.latestAction?.actionDate || b?.committeeActionDate || b?.updateDate || "";
    return ad > bd ? -1 : ad < bd ? 1 : 0;
  });

  const start = Number(cursor) || 0;
  const items = all.slice(start, start + limit);
  const nextCursor = start + items.length < all.length ? start + items.length : null;

  return NextResponse.json({ items, nextCursor, total: all.length, lastUpdated: store.lastUpdated });
}
