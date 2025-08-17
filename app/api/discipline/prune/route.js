import { NextResponse } from "next/server";
import { getSliceFile, replaceAllFile } from "@/lib/discipline-store-file";
import { quickDisciplineFromList } from "@/lib/discipline-filter";

export async function GET() {
  // pull everything via slices
  const all = [];
  let cursor = 0;
  const limit = 500; // big chunks to iterate quickly
  while (true) {
    const { items, nextCursor } = await getSliceFile(cursor, limit);
    all.push(...items);
    if (nextCursor == null) break;
    cursor = nextCursor;
  }

  // keep only those that pass the tighter strict filter
  const filtered = all.filter((b) =>
    quickDisciplineFromList(b, { strict: true })
  );

  await replaceAllFile(filtered);
  return NextResponse.json({
    ok: true,
    kept: filtered.length,
    pruned: all.length - filtered.length,
  });
}
