import { NextResponse } from "next/server";
import { loadStore } from "@/lib/ethicsCommitteeStore";

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(Number(searchParams.get("limit") ?? 12), 48)
  );
  const cursor = Number(params.cursor ?? 0);

  const state = await loadStore();
  const rows = Array.from(state.map.values());

  // Sort newest-first by latestAction.actionDate, fallback to updateDate or committeeActionDate
  rows.sort((a, b) => {
    const da =
      a?.latestAction?.actionDate ||
      a?.updateDate ||
      a?.committeeActionDate ||
      "1900-01-01";
    const db =
      b?.latestAction?.actionDate ||
      b?.updateDate ||
      b?.committeeActionDate ||
      "1900-01-01";
    return db.localeCompare(da);
  });

  const slice = rows.slice(cursor, cursor + limit);
  const nextCursor =
    cursor + slice.length < rows.length ? cursor + slice.length : null;

  // Normalize fields expected by your cards
  const items = slice.map((b) => ({
    congress: b.congress,
    type: b.type,
    number: b.number,
    title: b.title,
    originChamber: b.originChamber,
    originChamberCode: b.originChamberCode,
    latestAction: b.latestAction,
    introducedDate: b.introducedDate, // may be absent; card already guards this
    url: b.detailUrl || b.url || null,
  }));

  return NextResponse.json({
    ok: true,
    count: items.length,
    total: rows.length,
    nextCursor,
    items,
  });
}
