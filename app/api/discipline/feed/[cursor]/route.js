import { NextResponse } from "next/server";
import { getSliceFile } from "@/lib/discipline-store-file";

export async function GET(req, { params }) {
  const url = new URL(req.url);
  const cursor = Number(params?.cursor || 0) || 0;
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 12)));
  const data = await getSliceFile(cursor, limit);
  return NextResponse.json({ ok: true, ...data }, { headers: { "Cache-Control": "no-store" } });
}
