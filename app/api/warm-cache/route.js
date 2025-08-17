import { NextResponse } from "next/server";

const OFFSETS = [0, 12, 24];
const TOPICS = ["discipline"];

export async function GET() {
  const started = Date.now();
  const hits = [];
  await Promise.all(
    TOPICS.flatMap((topic) =>
      OFFSETS.map(async (offset) => {
        const u = new URL(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/list-bills/${offset}`
        );
        u.searchParams.set("topic", topic);
        const r = await fetch(u.toString(), { cache: "no-store" });
        hits.push({ topic, offset, ok: r.ok, status: r.status });
      })
    )
  );
  return NextResponse.json({ ms: Date.now() - started, hits });
}
