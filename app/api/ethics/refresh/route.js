// app/api/ethics/committee-refresh/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ETHICS_COMMITTEES, billKey } from "@/lib/ethicsCommittee";
import { loadStore, saveStore } from "@/lib/ethicsCommitteeStore";

function isoFromDays(days) {
  const d = new Date(Date.now() - Number(days || 0) * 86400000);
  return `${d.toISOString().slice(0, 10)}T00:00:00Z`;
}

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const days    = Number(searchParams.get("days")    ?? 30);
  const limit   = Number(searchParams.get("limit")   ?? 250); // congress.gov max = 250
  const pages   = Number(searchParams.get("pages")   ?? 60);
  const confirm =        searchParams.get("confirm") === "1"; // write to store?
  const wide    =        searchParams.get("wide")    === "1"; // enrich via detail
  const log     =        searchParams.get("log")     === "1";

  const fromDateTime = searchParams.get("fromDateTime") || isoFromDays(days);
  const apiKey = process.env.CONGRESS_GOV_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json({ ok:false, error:"Missing CONGRESS_GOV_API_KEY" }, { status: 500 });
  }

  const store = await loadStore(); // { map: Map<string, object>, ... }
  let addedOrUpdated = 0;

  for (const { chamber, code } of ETHICS_COMMITTEES) {
    for (let page = 0; page < pages; page++) {
      const offset = page * limit;
      const listURL =
        `https://api.congress.gov/v3/committee/${chamber}/${code}/bills` +
        `?format=json&limit=${limit}&offset=${offset}` +
        `&fromDateTime=${encodeURIComponent(fromDateTime)}` +
        `&api_key=${apiKey}`;

      let data;
      try {
        data = await fetchJSON(listURL, { cache: "no-store" });
      } catch (e) {
        if (log) console.warn("[ethics/committee-refresh] list error:", e.message);
        break; // stop this committee on error
      }

      const bills = data?.["committee-bills"]?.bills ?? [];
      if (log) {
        console.log("[ethics/committee-refresh] %s/%s page=%d rows=%d",
          chamber, code, page, bills.length);
      }
      if (bills.length === 0) break;

      for (const row of bills) {
        const base = {
          congress: row.congress,
          type: String(row.type || "").toUpperCase(),
          number: row.number,
          relationshipType: row.relationshipType || null,      // e.g. "Referred to"
          committeeActionDate: row.actionDate || null,         // when it hit the committee
          committee: { chamber, code },
          title: null,
          latestAction: null,
          originChamber: null,
          originChamberCode: null,
          updateDate: row.updateDate || null,
          detailUrl: row.url || null,                          // bill detail endpoint
          sponsorIds: [],
          cosponsorIds: [],
        };

        const key = billKey(base);
        const prev = store.map.get(key);

        // If we already have the same updateDate and wide=0, we can skip detail fetch
        const shouldFetchDetail = wide || !prev || (prev.updateDate !== base.updateDate);

        if (shouldFetchDetail && base.detailUrl) {
          try {
            const detail = await fetchJSON(`${base.detailUrl}&api_key=${apiKey}`, { next: { revalidate: 900 } });
            const b = detail?.bill ?? detail ?? {};
            base.title = b.title || b.titleWithoutNumber || null;
            base.latestAction = b.latestAction || null;
            base.originChamber = b.originChamber || b.chamber || null;
            base.originChamberCode = b.originChamberCode || null;
            base.updateDate = b.updateDate || base.updateDate;

            // try to capture sponsors/cosponsors bioguideIds for member matching
            const sIds = Array.isArray(b?.sponsors) ? b.sponsors
              .map(s => s?.bioguideId).filter(Boolean) : [];
            const cIds = Array.isArray(b?.cosponsors?.items) ? b.cosponsors.items
              .map(c => c?.bioguideId).filter(Boolean)
              : (Array.isArray(b?.cosponsors) ? b.cosponsors.map(c => c?.bioguideId).filter(Boolean) : []);
            base.sponsorIds = sIds;
            base.cosponsorIds = cIds;
          } catch (e) {
            if (log) console.warn("[ethics/committee-refresh] detail error:", e.message);
          }
        } else if (prev) {
          // keep existing enriched fields if we didn’t fetch
          base.title = prev.title ?? base.title;
          base.latestAction = prev.latestAction ?? base.latestAction;
          base.originChamber = prev.originChamber ?? base.originChamber;
          base.originChamberCode = prev.originChamberCode ?? base.originChamberCode;
          base.sponsorIds = Array.isArray(prev.sponsorIds) ? prev.sponsorIds : [];
          base.cosponsorIds = Array.isArray(prev.cosponsorIds) ? prev.cosponsorIds : [];
        }

        const merged = { ...(prev || {}), ...base, lastCached: Date.now() };
        store.map.set(key, merged);
        addedOrUpdated++;
      }
    }
  }

  if (confirm) await saveStore(store);

  return NextResponse.json({
    ok: true,
    mode: "ethics-committee-refresh",
    days,
    fromDateTime,
    confirm,
    wide: wide === true,
    addedOrUpdated,
  });
}
