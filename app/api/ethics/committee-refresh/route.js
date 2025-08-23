import { NextResponse } from "next/server";
import { ETHICS_COMMITTEES, billKey } from "@/lib/ethicsCommittee";
import { loadStore, saveStore } from "@/lib/ethicsCommitteeStore";

function isoFromDays(days) {
  const d = new Date(Date.now() - days * 86400000);
  return `${d.toISOString().slice(0, 10)}T00:00:00Z`;
}
async function j(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const days = Number(searchParams.get("days") ?? 30);
  const fromDateTime = searchParams.get("fromDateTime") || isoFromDays(days);

  const limit = Math.min(Number(searchParams.get("limit") ?? 250), 250);
  const pages = Math.min(Number(searchParams.get("pages") ?? 200), 200);

  const confirm = searchParams.get("confirm") === "1"; // if true => save
  const wide = searchParams.get("wide") === "1"; // if true => fetch detail
  const log = searchParams.get("log") === "1";

  const apiKey = process.env.CONGRESS_GOV_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing CONGRESS_GOV_API_KEY" },
      { status: 500 }
    );
  }

  const state = await loadStore();
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
        data = await j(listURL, { cache: "no-store" });
      } catch (e) {
        if (log)
          console.warn("[ethics/committee-refresh] list err:", e.message);
        break;
      }

      const rows = data?.["committee-bills"]?.bills ?? [];
      if (log)
        console.log(
          "[ethics/committee-refresh] %s/%s page=%d rows=%d",
          chamber,
          code,
          page,
          rows.length
        );
      if (rows.length === 0) break;

      for (const row of rows) {
        const base = {
          congress: row.congress,
          type: String(row.type || "").toUpperCase(),
          number: row.number,
          relationshipType: row.relationshipType || null, // "Referred to", etc.
          committeeActionDate: row.actionDate || null, // timestamp from committee list
          committee: { chamber, code },
          title: null,
          latestAction: null,
          originChamber: null,
          originChamberCode: null,
          updateDate: row.updateDate || null,
          detailUrl: row.url || null,
          sponsorIds: [],
          cosponsorIds: [],
          lastCached: Date.now(),
        };

        // Optional enrichment from bill detail
        if (wide && base.detailUrl) {
          try {
            const detail = await j(`${base.detailUrl}&api_key=${apiKey}`, {
              next: { revalidate: 900 },
            });
            const b = detail?.bill ?? detail ?? {};

            base.title = b.title || b.titleWithoutNumber || base.title || null;
            base.latestAction = b.latestAction || base.latestAction || null;
            base.originChamber = b.originChamber || b.chamber || null;
            base.originChamberCode = b.originChamberCode || null;
            base.updateDate = b.updateDate || base.updateDate;

            // capture sponsors/cosponsors for member pages
            if (Array.isArray(b.sponsors)) {
              base.sponsorIds = b.sponsors
                .map((s) => s?.bioguideId)
                .filter(Boolean);
            }
            if (Array.isArray(b.cosponsors)) {
              base.cosponsorIds = b.cosponsors
                .map((s) => s?.bioguideId)
                .filter(Boolean);
            }
          } catch (e) {
            if (log)
              console.warn("[ethics/committee-refresh] detail err:", e.message);
          }
        }

        const key = billKey(base); // e.g. "119:HRES:123"
        const prev = state.map.get(key);
        // Keep the most recent committeeActionDate we’ve ever seen
        const merged = {
          ...(prev || {}),
          ...base,
          committeeActionDate:
            base.committeeActionDate &&
            (!prev ||
              new Date(base.committeeActionDate) >
                new Date(prev.committeeActionDate))
              ? base.committeeActionDate
              : prev?.committeeActionDate ?? base.committeeActionDate,
        };

        state.map.set(key, merged);
        addedOrUpdated++;
      }
    }
  }

  if (confirm) await saveStore(state);

  return NextResponse.json({
    ok: true,
    mode: "ethics-committee-refresh",
    days,
    fromDateTime,
    confirm,
    wide,
    addedOrUpdated,
  });
}
