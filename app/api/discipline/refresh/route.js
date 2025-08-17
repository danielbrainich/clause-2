import { NextResponse } from "next/server";
import { upsertManyFile } from "@/lib/discipline-store-file";
import { quickDisciplineFromList } from "@/lib/discipline-filter";

const API_BASE = "https://api.congress.gov/v3";

export async function GET(req) {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing CONGRESS_GOV_API_KEY" }, { status: 500 });
  }

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(120, Number(url.searchParams.get("days") || 30)));
  const LIST_LIMIT = Math.max(10, Math.min(250, Number(url.searchParams.get("limit") || 200)));
  const MAX_PAGES  = Math.max(1, Math.min(40, Number(url.searchParams.get("pages") || 8)));
  const STRICT     = url.searchParams.get("strict") !== "0"; // default strict

  const since = new Date(Date.now() - days * 864e5);
  const found = [];
  const seen = new Set();

  let offset = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const listURL = new URL(`${API_BASE}/bill`);
    listURL.searchParams.set("api_key", apiKey);
    listURL.searchParams.set("format", "json");
    listURL.searchParams.set("limit", String(LIST_LIMIT));
    listURL.searchParams.set("offset", String(offset));

    const res = await fetch(listURL, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ ok:false, where:"list", status:res.status, body: body.slice(0,300) }, { status: 502 });
    }

    const json = await res.json();
    const items = Array.isArray(json?.bills) ? json.bills : [];
    if (items.length === 0) break;

    let pageAllOlder = true;
    for (const b of items) {
      const lad = b?.latestAction?.actionDate ? new Date(b.latestAction.actionDate) : null;
      if (lad && lad >= since) pageAllOlder = false;
      if (!lad || lad < since) continue;
      if (!quickDisciplineFromList(b, { strict: STRICT })) continue;

      const nb = {
        congress: b.congress,
        type: b.type,
        number: b.number,
        title: b.title,
        originChamber: b.originChamber || b.chamber || null,
        latestAction: b.latestAction || null,
        congressdotgov_url: b.url || null,
        updateDate: b.updateDate || null,
      };
      const k = `${b.congress}-${String(b.type).toUpperCase()}-${b.number}`;
      if (!seen.has(k)) { seen.add(k); found.push(nb); }
    }

    offset += LIST_LIMIT;
    // If an entire page was older than the window and we’ve already scanned a couple, bail early.
    if (pageAllOlder && page > 1) break;
  }

  await upsertManyFile(found);
  return NextResponse.json({ ok: true, mode: "incremental", added: found.length, lastUpdated: Date.now(), days });
}
