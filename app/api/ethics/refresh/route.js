// app/api/ethics/refresh/route.js
import { NextResponse } from "next/server";
import { ETHICS_COMMITTEES, billKey } from "@/lib/ethicsCommittee";
import { loadStore, saveStore } from "@/lib/ethicsCommitteeStore";

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function isoFromDays(days) {
  const d = new Date(Date.now() - days * 86400000);
  return `${d.toISOString().slice(0, 10)}T00:00:00Z`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 30);
  const limit = Number(searchParams.get("limit") ?? 250);
  const pages = Number(searchParams.get("pages") ?? 200);
  const confirm = searchParams.get("confirm") === "1";
  const wide = searchParams.get("wide") === "1";
  const log = searchParams.get("log") === "1";

  const fromDateTime = searchParams.get("fromDateTime") || isoFromDays(days);
  const apiKey = process.env.CONGRESS_GOV_API_KEY || "";

  const store = await loadStore();
  let addedOrUpdated = 0;

  for (const { chamber, code } of ETHICS_COMMITTEES) {
    for (let page = 0; page < pages; page++) {
      const offset = page * limit;
      const listURL =
        `https://api.congress.gov/v3/committee/${chamber}/${code}/bills` +
        `?format=json&limit=${limit}&offset=${offset}&fromDateTime=${encodeURIComponent(fromDateTime)}` +
        `&api_key=${apiKey}`;

      let data;
      try {
        data = await fetchJSON(listURL, { cache: "no-store" });
      } catch (e) {
        if (log) console.warn("[ethics/refresh] list err:", e.message);
        break;
      }

      const bills = data?.["committee-bills"]?.bills ?? [];
      if (log) console.log("[ethics/refresh] %s/%s page=%d rows=%d", chamber, code, page, bills.length);
      if (bills.length === 0) break;

      for (const row of bills) {
        const base = {
          congress: row.congress,
          type: String(row.type || "").toUpperCase(),
          number: row.number,
          relationshipType: row.relationshipType || null, // "Referred to", etc.
          committeeActionDate: row.actionDate || null,   // when it hit the committee
          committee: { chamber, code },
          // enrichment targets:
          title: null,
          latestAction: null,
          originChamber: null,
          originChamberCode: null,
          updateDate: row.updateDate || null,
          detailUrl: row.url || null,
        };

        // Compute key FIRST, then look up what we already have
        const key = billKey(base);
        const prev = store.map.get(key);

        // Decide if we need a detail fetch (only when wide && changed updateDate)
        const needsDetail =
          wide &&
          !!base.detailUrl &&
          (!prev || prev.updateDate !== base.updateDate);

        if (needsDetail) {
          try {
            const detail = await fetchJSON(`${base.detailUrl}&api_key=${apiKey}`, {
              next: { revalidate: 900 },
            });
            const b = detail?.bill ?? detail ?? {};
            base.title = b.title || b.titleWithoutNumber || null;
            base.latestAction = b.latestAction || null;
            base.originChamber = b.originChamber || b.chamber || null;
            base.originChamberCode = b.originChamberCode || null;
            base.updateDate = b.updateDate || base.updateDate;
          } catch (e) {
            if (log) console.warn("[ethics/refresh] detail err:", e.message);
          }
        } else {
          // No detail fetch — keep any previously enriched fields
          if (prev) {
            base.title = prev.title ?? base.title;
            base.latestAction = prev.latestAction ?? base.latestAction;
            base.originChamber = prev.originChamber ?? base.originChamber;
            base.originChamberCode = prev.originChamberCode ?? base.originChamberCode;
            // keep the most recent updateDate we know about
            base.updateDate = prev.updateDate ?? base.updateDate;
          }
        }

        // Merge with any existing record; keep the newest committeeActionDate
        const merged = {
          ...(prev || {}),
          ...base,
          committeeActionDate: newerDate(prev?.committeeActionDate, base.committeeActionDate),
          lastCached: Date.now(),
        };

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
    addedOrUpdated,
  });
}

// Helper: return the later of two ISO date strings (or whichever exists)
function newerDate(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  return a > b ? a : b;
}
