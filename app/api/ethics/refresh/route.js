import { NextResponse } from "next/server";
import {
  pickBillFields,
  quickEthicsFromList,
  ETHICS_COMMITTEE_NAME_RE,
  isCongressType,
} from "@/lib/ethics-filter";
import { fetchBillCommittees } from "@/lib/congress-utils";
import { upsertManyFile } from "@/lib/discipline-store-file";

export const dynamic = "force-dynamic";

const API_BASE = "https://api.congress.gov/v3";

export async function GET(req) {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing CONGRESS_GOV_API_KEY" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const wide = url.searchParams.get("wide") === "1"; // opt-in to year-long windows
  const MAX_DAYS = wide ? 365 : 30; // default cap is 30d unless wide=1
  const DAYS = Math.max(
    1,
    Math.min(MAX_DAYS, Number(url.searchParams.get("days") || 2))
  );

  const LIMIT = Math.max(
    10,
    Math.min(250, Number(url.searchParams.get("limit") || 200))
  );
  const PAGES = Math.max(
    1,
    Math.min(40, Number(url.searchParams.get("pages") || 4))
  );

  const CONFIRM = url.searchParams.get("confirm") === "1"; // committee-verify (slower, more accurate)
  const TYPES = (url.searchParams.get("types") || "hres,sres")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const LOG = url.searchParams.get("log") === "1";
  const log = (...args) => {
    if (LOG) console.log("[ethics/refresh]", ...args);
  };

  const since = new Date(Date.now() - DAYS * 86_400_000);
  const found = [];
  const seen = new Set();

  for (const type of TYPES) {
    let offset = 0;
    for (let page = 0; page < PAGES; page++) {
      const u = new URL(`${API_BASE}/bill`);
      u.searchParams.set("billType", type.toLowerCase()); // e.g., hres, sres
      u.searchParams.set("api_key", apiKey);
      u.searchParams.set("format", "json");
      u.searchParams.set("limit", String(LIMIT));
      u.searchParams.set("offset", String(offset));
      u.searchParams.set("sort", "updateDate+desc");

      const r = await fetch(u.toString(), { cache: "no-store" });
      if (!r.ok) {
        const sample = await r
          .text()
          .then((s) => s.slice(0, 300))
          .catch(() => "");
        log(`list fetch failed type=${type} status=${r.status}`);
        return NextResponse.json(
          { ok: false, where: "list", status: r.status, sample },
          { status: 502 }
        );
      }

      const j = await r.json();
      const bills = Array.isArray(j?.bills) ? j.bills : [];
      log(`type=${type} page=${page} offset=${offset} rows=${bills.length}`);
      if (bills.length === 0) break;

      let anyInWindow = false;
      let keptThisPage = 0;

      for (const b of bills) {
        try {
          if (!isCongressType(b?.type)) continue;

          const ladStr = b?.latestAction?.actionDate;
          const lad = ladStr ? new Date(ladStr) : null;
          if (!lad || lad < since) continue;
          anyInWindow = true;

          let keep = quickEthicsFromList(b); // fast: matches latestAction for Ethics referral

          // If not obvious from latestAction, optionally confirm via committees subresource
          if (!keep && CONFIRM) {
            const committees = await fetchBillCommittees({
              congress: b.congress,
              type: b.type,
              number: b.number,
              apiKey,
            });
            if (
              Array.isArray(committees) &&
              committees.some((c) =>
                ETHICS_COMMITTEE_NAME_RE.test(String(c?.name || ""))
              )
            ) {
              keep = true;
            }
          }

          if (!keep) continue;

          const key = `${b.congress}-${String(b.type).toUpperCase()}-${
            b.number
          }`;
          if (seen.has(key)) continue;
          seen.add(key);

          found.push(pickBillFields(b));
          keptThisPage++;
        } catch {
          // ignore row errors
        }
      }

      log(`keptThisPage=${keptThisPage} anyInWindow=${anyInWindow}`);
      if (!anyInWindow) break;
      offset += LIMIT;
    }
  }

  if (found.length) {
    await upsertManyFile(found); // add/update items in your cache
  }

  return NextResponse.json({
    ok: true,
    mode: "ethics-refresh",
    days: DAYS,
    confirm: CONFIRM,
    addedOrUpdated: found.length,
  });
}
