import { NextResponse } from "next/server";
import {
  pickBillFields,
  quickEthicsFromList,
  ETHICS_COMMITTEE_NAME_RE,
  isCongressType,
} from "@/lib/ethics-filter";
import { fetchBillCommittees } from "@/lib/congress-utils";
import { replaceAllFile } from "@/lib/discipline-store-file";

const API_BASE = "https://api.congress.gov/v3";
const oddYear = (y) => (y % 2 === 0 ? y - 1 : y);
function congressFromYear(year) {
  return Math.floor((year - 1789) / 2) + 1;
}

export async function GET(req) {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { ok: false, error: "Missing CONGRESS_GOV_API_KEY" },
      { status: 500 }
    );

  const url = new URL(req.url);
  const YEARS = Math.max(
    1,
    Math.min(25, Number(url.searchParams.get("years") || 10))
  );
  const LIMIT = Math.max(
    10,
    Math.min(250, Number(url.searchParams.get("limit") || 200))
  );
  const PAGES = Math.max(
    1,
    Math.min(400, Number(url.searchParams.get("pages") || 120))
  );
  const CONFIRM = url.searchParams.get("confirm") === "1";
  const TYPES = (url.searchParams.get("types") || "hres,sres")
    .split(",")
    .map((t) => t.trim());

  // Optional: only log when ?log=1
  const LOG = url.searchParams.get("log") === "1";
  const log = (...args) => {
    if (LOG) console.log(...args);
  }; // 🔵 LOG

  const started = Date.now(); // 🔵 LOG
  let totalKept = 0; // 🔵 LOG
  let totalRows = 0; // 🔵 LOG

  const now = new Date();
  const since = new Date(now.getTime() - YEARS * 365 * 24 * 60 * 60 * 1000);
  const currentCongress = congressFromYear(oddYear(now.getFullYear()));
  const firstCongress = congressFromYear(oddYear(since.getFullYear()));

  const found = [];
  const seen = new Set();

  for (let c = currentCongress; c >= firstCongress; c--) {
    for (const type of TYPES) {
      log(`[ethics/backfill] ▶️ congress=${c} type=${type} start`); // 🔵 LOG
      let offset = 0;

      for (let page = 0; page < PAGES; page++) {
        log(`[ethics/backfill]   page=${page} offset=${offset}`); // 🔵 LOG

        const listURL = new URL(`${API_BASE}/bill/${c}/${type}`);
        listURL.searchParams.set("api_key", apiKey);
        listURL.searchParams.set("format", "json");
        listURL.searchParams.set("limit", String(LIMIT));
        listURL.searchParams.set("offset", String(offset));
        listURL.searchParams.set("sort", "updateDate+desc");

        const res = await fetch(listURL.toString(), { cache: "no-store" });
        if (!res.ok) {
          const sample = await res
            .text()
            .then((s) => s.slice(0, 300))
            .catch(() => "");
          log(`[ethics/backfill] ❌ list fetch failed status=${res.status}`); // 🔵 LOG
          return NextResponse.json(
            { ok: false, where: "list", status: res.status, sample },
            { status: 502 }
          );
        }
        const json = await res.json();
        const bills = Array.isArray(json?.bills) ? json.bills : [];
        if (bills.length === 0) {
          log(`[ethics/backfill]   break: empty page`); // 🔵 LOG
          break;
        }
        log(`[ethics/backfill]   fetched ${bills.length} rows`); // 🔵 LOG

        let pageHasAnyInWindow = false;
        const keptBefore = totalKept; // 🔵 LOG

        for (const b of bills) {
          totalRows++; // 🔵 LOG
          try {
            if (!isCongressType(b?.type)) continue;

            const ladStr = b?.latestAction?.actionDate;
            const lad = ladStr ? new Date(ladStr) : null;
            if (!lad || lad < since) continue;
            pageHasAnyInWindow = true;

            let keep = quickEthicsFromList(b);

            if (!keep && CONFIRM) {
              const committees = await fetchBillCommittees({
                congress: b.congress,
                type: b.type,
                number: b.number,
                apiKey,
              });
              if (
                Array.isArray(committees) &&
                committees.some((ct) =>
                  ETHICS_COMMITTEE_NAME_RE.test(String(ct?.name || ""))
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
            totalKept++; // 🔵 LOG
          } catch (e) {
            // skip bad rows
          }
        }

        const keptThisPage = totalKept - keptBefore; // 🔵 LOG
        log(
          `[ethics/backfill]   page done kept=${keptThisPage} totalKept=${totalKept} ` +
            `windowHit=${pageHasAnyInWindow} elapsed=${(
              (Date.now() - started) /
              1000
            ).toFixed(1)}s`
        ); // 🔵 LOG

        if (!pageHasAnyInWindow) {
          log(`[ethics/backfill]   break: out of window`); // 🔵 LOG
          break;
        }
        offset += LIMIT;
      }

      log(
        `[ethics/backfill] finished congress=${c} type=${type} totalKept=${totalKept}`
      ); // LOG
    }
  }

  // newest first
  found.sort((a, b) => {
    const da = a?.latestAction?.actionDate
      ? Date.parse(a.latestAction.actionDate)
      : 0;
    const db = b?.latestAction?.actionDate
      ? Date.parse(b.latestAction.actionDate)
      : 0;
    return db - da;
  });

  await replaceAllFile(found);

  log(
    `[ethics/backfill] 🏁 DONE total=${found.length} scanned=${totalRows} ` +
      `took=${((Date.now() - started) / 1000).toFixed(1)}s`
  ); // 🔵 LOG

  return NextResponse.json({
    ok: true,
    mode: "ethics-backfill",
    years: YEARS,
    types: TYPES,
    confirm: CONFIRM,
    total: found.length,
    lastUpdated: Date.now(),
  });
}
