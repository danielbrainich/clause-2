import { NextResponse } from "next/server";
// Reuse file store from discipline; the most recent backfill controls contents
import { getSliceFile } from "@/lib/discipline-store-file";

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 12)));
  const cursor = Number(params?.cursor || 0) || 0;

  try {
    const { items, nextCursor } = await getSliceFile(cursor, limit);
    return NextResponse.json({
      ok: true,
      items: Array.isArray(items) ? items : [],
      nextCursor: nextCursor ?? null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
