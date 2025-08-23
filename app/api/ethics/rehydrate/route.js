import { NextResponse } from "next/server";
import { loadStore, saveStore } from "@/lib/ethicsCommitteeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function extractSponsorIds(detail) {
  const out = [];
  const arr = detail?.bill?.sponsors?.items || detail?.bill?.sponsors || [];
  for (const it of arr) {
    const id = it?.bioguideId || it?.bioguideID || it?.bioguide_id;
    if (id) out.push(id);
  }
  return out.length ? out : null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const confirm = searchParams.get("confirm") !== "0"; // default true
  const missingOnly = searchParams.get("missingOnly") !== "0"; // default true
  const wide = searchParams.get("wide") === "1"; // if true, also fetch sponsors
  const max = Number(searchParams.get("max") ?? 100000);
  const log = searchParams.get("log") === "1";

  const apiKey = process.env.CONGRESS_GOV_API_KEY || "";
  const store = await loadStore();

  const rows = Array.from(store.map.values());
  let scanned = 0,
    touched = 0,
    skipped = 0,
    errors = 0;

  for (const base of rows) {
    if (scanned >= max) break;
    scanned++;

    const needTitle = !base.title;
    const needLatestAction = !base.latestAction;
    const needSponsors = wide && !Array.isArray(base.sponsorIds);
    const need = needTitle || needLatestAction || needSponsors;

    if (missingOnly && !need) {
      skipped++;
      continue;
    }
    if (!base.detailUrl) {
      skipped++;
      continue;
    }

    try {
      const url = `${base.detailUrl}&api_key=${apiKey}`;
      const detail = await fetchJSON(url, { next: { revalidate: 900 } });
      const b = detail?.bill ?? detail ?? {};

      if (needTitle)
        base.title = b.title || b.titleWithoutNumber || base.title || null;
      if (needLatestAction)
        base.latestAction = b.latestAction || base.latestAction || null;
      base.updateDate = b.updateDate || base.updateDate || null;

      if (needSponsors) {
        const ids = extractSponsorIds(detail);
        if (ids) base.sponsorIds = ids;
      }

      base.lastCached = Date.now();
      const key = `${base.congress}-${String(base.type).toUpperCase()}-${
        base.number
      }`;
      store.map.set(key, base);
      touched++;
      if (log) console.log("[rehydrate] updated", key);
    } catch (e) {
      errors++;
      if (log) console.warn("[rehydrate] error:", e.message);
    }
  }

  if (confirm) await saveStore(store);

  return NextResponse.json({
    ok: true,
    mode: "ethics-rehydrate",
    scanned,
    touched,
    skipped,
    errors,
    confirm,
    missingOnly,
    wide,
  });
}
