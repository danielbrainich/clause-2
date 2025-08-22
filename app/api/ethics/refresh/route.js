import { NextResponse } from "next/server";
import { ETHICS_COMMITTEES, billKey } from "@/lib/ethicsCommittee";
import { loadStore, saveStore } from "@/lib/ethicsCommitteeStore";

function isoFromDays(days) {
  const d = new Date(Date.now() - Number(days || 0) * 86400000);
  return `${d.toISOString().slice(0, 10)}T00:00:00Z`; // Zulu midnight
}

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // knobs
  const days = Number(searchParams.get("days") ?? 30);
  const limit = Number(searchParams.get("limit") ?? 250); // max 250
  const pages = Number(searchParams.get("pages") ?? 200);
  const wide = searchParams.get("wide") === "1"; // fetch bill detail for title/latestAction + sponsor IDs
  const confirm = searchParams.get("confirm") === "1"; // save to store when true
  const log = searchParams.get("log") === "1";

  const fromDateTime = searchParams.get("fromDateTime") || isoFromDays(days);
  const apiKey = process.env.CONGRESS_GOV_API_KEY || "";

  const store = await loadStore();
  let addedOrUpdated = 0;

  // Iterate House/Senate ethics committees
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
        if (log)
          console.warn("[ethics/refresh] list error:", e.message, {
            chamber,
            code,
            page,
          });
        break; // stop paging this committee on error
      }

      const bills = data?.["committee-bills"]?.bills ?? [];
      if (log)
        console.log(
          "[ethics/refresh] %s/%s page=%d rows=%d",
          chamber,
          code,
          page,
          bills.length
        );
      if (bills.length === 0) break;

      for (const row of bills) {
        // base record from committee list
        const base = {
          congress: row.congress,
          type: String(row.type || "").toUpperCase(),
          number: row.number,
          relationshipType: row.relationshipType || null, // e.g., "Referred to"
          committeeActionDate: row.actionDate || null, // when it hit the committee
          committee: { chamber, code },
          // enrich fields (maybe via detail)
          title: null,
          latestAction: null,
          originChamber: null,
          originChamberCode: null,
          updateDate: row.updateDate || null,
          detailUrl: row.url || null,
          // will add sponsorIds/cosponsorIds in wide mode
          sponsorIds: undefined,
          cosponsorIds: undefined,
        };

        const key = billKey(base);
        const prev = store.map.get(key);

        // Only fetch detail if asked (wide) AND we don't already have an up-to-date record
        const shouldDetail =
          wide &&
          base.detailUrl &&
          !(
            prev &&
            prev.updateDate &&
            base.updateDate &&
            prev.updateDate === base.updateDate
          );

        if (shouldDetail) {
          try {
            const detail = await fetchJSON(
              `${base.detailUrl}&api_key=${apiKey}`,
              { next: { revalidate: 900 } }
            );
            const b = detail?.bill ?? detail ?? {};

            base.title = b.title || b.titleWithoutNumber || null;
            base.latestAction = b.latestAction || null;
            base.originChamber = b.originChamber || b.chamber || null;
            base.originChamberCode = b.originChamberCode || null;
            base.updateDate = b.updateDate || base.updateDate;

            // Capture sponsor/cosponsor bioguide IDs for by-member queries
            const sponsorsArr = Array.isArray(b?.sponsors)
              ? b.sponsors
              : b?.sponsors?.items ?? [];
            const cosArr = Array.isArray(b?.cosponsors)
              ? b.cosponsors
              : b?.cosponsors?.items ?? [];

            base.sponsorIds = sponsorsArr
              .map((s) => s?.bioguideId || s?.sponsor?.bioguideId)
              .filter(Boolean);

            base.cosponsorIds = cosArr
              .map((s) => s?.bioguideId || s?.sponsor?.bioguideId)
              .filter(Boolean);
          } catch (e) {
            if (log)
              console.warn("[ethics/refresh] detail error:", e.message, {
                key,
              });
          }
        }

        // Merge & store (prefer newer base over prev)
        const merged = { ...(prev || {}), ...base, lastCached: Date.now() };
        store.map.set(key, merged);

        // count changes
        if (!prev) {
          addedOrUpdated++;
        } else {
          const prevStamp = prev.updateDate || prev.lastCached || 0;
          const newStamp = merged.updateDate || merged.lastCached || 0;
          if (newStamp !== prevStamp) addedOrUpdated++;
        }
      }
    }
  }

  if (confirm) await saveStore(store);

  return NextResponse.json({
    ok: true,
    mode: "ethics-refresh",
    days,
    fromDateTime,
    wide,
    confirm,
    addedOrUpdated,
  });
}
