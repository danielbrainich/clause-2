// app/api/discipline/backfill/route.js
import { NextResponse } from "next/server";
import { replaceAllFile } from "@/lib/discipline-store-file";
import { quickDisciplineFromList } from "@/lib/discipline-filter";

const API_BASE = "https://api.congress.gov/v3";

// Congress number for a given calendar year (odd-year Congress starts)
function congressFromYear(year) {
  return Math.floor((year - 1789) / 2) + 1;
}
function oddYear(y) { return y % 2 === 0 ? y - 1 : y; }

export async function GET(req) {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing CONGRESS_GOV_API_KEY" }, { status: 500 });
  }

  const url = new URL(req.url);
  const YEARS      = Math.max(1, Math.min(20, Number(url.searchParams.get("years") || 10)));
  const LIST_LIMIT = Math.max(10, Math.min(250, Number(url.searchParams.get("limit") || 200)));
  const MAX_PAGES  = Math.max(1, Math.min(500, Number(url.searchParams.get("pages") || 200)));
  const STRICT     = url.searchParams.get("strict") !== "0"; // default strict

  const now = new Date();
  const since = new Date(now.getTime() - YEARS * 365 * 24 * 60 * 60 * 1000);
  const currentCongress = congressFromYear(oddYear(now.getFullYear()));
  const firstCongress   = congressFromYear(oddYear(since.getFullYear()));

  // We only need resolutions for discipline (H.Res. / S.Res.)
  const TYPES = ["hres", "sres"];

  const found = [];
  const seen  = new Set();

  // Walk Congresses newest -> oldest
  for (let c = currentCongress; c >= firstCongress; c--) {
    for (const type of TYPES) {
      let offset = 0;
      for (let page = 0; page < MAX_PAGES; page++) {
        // Ask for newest first; page in chunks
        const listURL = new URL(`${API_BASE}/bill/${c}/${type}`);
        listURL.searchParams.set("api_key", apiKey);
        listURL.searchParams.set("format", "json");
        listURL.searchParams.set("limit", String(LIST_LIMIT));
        listURL.searchParams.set("offset", String(offset));
        // Congress.gov supports sort on list; updateDate is reliable for list-level.
        // (latestActionDate may exist but updateDate is explicitly supported.)
        listURL.searchParams.set("sort", "updateDate+desc");

        const res = await fetch(listURL, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.text();
          return NextResponse.json(
            { ok: false, where: "list", congress: c, type, status: res.status, sample: body.slice(0, 300) },
            { status: 502 }
          );
        }

        const json = await res.json();
        const items = Array.isArray(json?.bills) ? json.bills : [];
        if (items.length === 0) break;

        // Keep a flag to bail once this list is entirely older than `since`
        let pageHasAnyInWindow = false;

        for (const b of items) {
          const lad = b?.latestAction?.actionDate ? new Date(b.latestAction.actionDate) : null;
          if (!lad || lad < since) {
            // outside our window; skip but keep scanning this page
            continue;
          }
          pageHasAnyInWindow = true;
          if (!quickDisciplineFromList(b, { strict: STRICT })) continue;

          const k = `${b.congress}-${String(b.type).toUpperCase()}-${b.number}`;
          if (!seen.has(k)) {
            seen.add(k);
            found.push({
              congress: b.congress,
              type: b.type,
              number: b.number,
              title: b.title,
              originChamber: b.originChamber || b.chamber || null,
              latestAction: b.latestAction || null,
              updateDate: b.updateDate || null,
              congressdotgov_url: b.url || null,
            });
          }
        }

        // If this page had nothing inside the window and lists are sorted newest->oldest,
        // the rest of this (congress,type) will also be older — bail for this pair.
        if (!pageHasAnyInWindow) break;

        offset += LIST_LIMIT;
      }
    }
  }

  // newest first by latestAction date
  found.sort((a, b) => {
    const da = a?.latestAction?.actionDate ? Date.parse(a.latestAction.actionDate) : 0;
    const db = b?.latestAction?.actionDate ? Date.parse(b.latestAction.actionDate) : 0;
    return db - da;
  });

  await replaceAllFile(found);
  return NextResponse.json({
    ok: true,
    mode: "backfill",
    years: YEARS,
    congresses: { from: firstCongress, to: currentCongress },
    total: found.length,
    lastUpdated: Date.now(),
  });
}
