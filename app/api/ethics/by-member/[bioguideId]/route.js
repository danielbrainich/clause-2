// app/api/ethics/by-member/[bioguideId]/route.js
import { NextResponse } from "next/server";
import { loadStore } from "@/lib/ethicsCommitteeStore";

const esc = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function getBase(req) {
  const host = req.headers.get("host");
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (!host) return "http://localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

function parseMemberName(member) {
  const direct = member?.directOrderName; // "Last, First M."
  const last = member?.lastName || (direct ? direct.split(",")[0]?.trim() : null);
  const firstRaw =
    member?.firstName ||
    (direct?.includes(",") ? direct.split(",")[1]?.trim() : null);
  const first = firstRaw ? firstRaw.split(/\s+/)[0] : null;
  return { first, last };
}

function buildTargetRegex({ first, last }, { loose = false } = {}) {
  if (!last) return null;
  const lastRx = esc(last);
  const firstRx = first ? esc(first) : null;

  const strict = [
    `(?:Rep\\.?|Representative|Sen\\.?|Senator)\\s+(?:${firstRx ? `${firstRx}\\s+` : ""})${lastRx}`,
    firstRx ? `${lastRx},\\s*${firstRx}` : null,
  ].filter(Boolean);

  if (!loose) return new RegExp(`\\b(?:${strict.join("|")})\\b`, "i");

  const disc = `(censur(?:e|ed|es|ing)|reprimand(?:ed|s|ing)?|expel(?:led|s|ling)?|expulsion|condemn(?:ed|s|ing)?|condemnation)`;
  const loosePiece = `(?:${disc}).{0,80}\\b(?:Rep\\.?|Representative|Sen\\.?|Senator)?\\s*${lastRx}\\b`;
  return new RegExp(`\\b(?:${strict.join("|")}|${loosePiece})\\b`, "i");
}

function norm(b) {
  return {
    congress: b.congress,
    type: b.type,
    number: b.number,
    title: b.title || b.titleWithoutNumber || null,
    originChamber: b.originChamber || b.chamber || null,
    latestAction: b.latestAction || null, // { text, actionDate } or string
    introducedDate: b.introducedDate || b.introDate || null,
    updateDate: b.updateDate || null,
  };
}

function latestDate(b) {
  const la = b?.latestAction;
  if (la && typeof la === "object" && la.actionDate) return la.actionDate;
  return b?.updateDate || b?.introducedDate || null;
}

const uniqByKey = (arr) => {
  const seen = new Set();
  const out = [];
  for (const b of arr) {
    const k = `${b.congress}-${String(b.type).toUpperCase()}-${b.number}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(b);
    }
  }
  return out;
};

const sortDesc = (a, b) =>
  String(latestDate(b) || "").localeCompare(String(latestDate(a) || ""));

export async function GET(req, { params }) {
  const { bioguideId } = params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const loose = searchParams.get("loose") === "1";
  const debug = searchParams.get("debug") === "1";

  // 1) Load ethics store
  const store = await loadStore();
  const map = store?.map;

  // Normalize to a plain array we can iterate multiple times
  const items =
    map instanceof Map
      ? Array.from(map.values())
      : map && typeof map === "object"
      ? Object.values(map)
      : [];

  if (debug) {
    const keysPreview =
      map instanceof Map
        ? Array.from(map.keys()).slice(0, 10)
        : Object.keys(map || {}).slice(0, 10);
    console.log("[by-member] keys:", keysPreview);
    console.log("[by-member] sample item:", items[0]);
  }

  // 2) Get member name (for targeted regex)
  let targetRe = null;
  try {
    const base = getBase(req);
    const r = await fetchJSON(`${base}/api/show-rep/${bioguideId}`, {
      cache: "no-store",
    });
    const name = r?.member ? parseMemberName(r.member) : {};
    targetRe = buildTargetRegex(name, { loose });
  } catch {
    // fine; targeted matching will be disabled without a name
  }

  // 3) Partition results
  const authored = [];
  const cosponsored = [];
  const targeted = [];

  for (const item of items) {
    const sponsors = Array.isArray(item?.sponsorIds) ? item.sponsorIds : [];
    const cosponsors = Array.isArray(item?.cosponsorIds) ? item.cosponsorIds : [];
    const title = String(item?.title || item?.titleWithoutNumber || "");
    const laText =
      typeof item?.latestAction === "string"
        ? item.latestAction
        : String(item?.latestAction?.text || "");

    if (sponsors.includes(bioguideId)) {
      authored.push(norm(item));
      continue; // authored wins for this item
    }
    if (cosponsors.includes(bioguideId)) {
      cosponsored.push(norm(item));
    }
    if (targetRe && (targetRe.test(title) || targetRe.test(laText))) {
      targeted.push(norm(item));
    }
  }

  const authoredOut = uniqByKey(authored).sort(sortDesc).slice(0, limit);
  const cosponsoredOut = uniqByKey(cosponsored).sort(sortDesc).slice(0, limit);
  const targetedOut = uniqByKey(targeted).sort(sortDesc).slice(0, limit);

  return NextResponse.json({
    ok: true,
    counts: {
      authored: authoredOut.length,
      cosponsored: cosponsoredOut.length,
      targeted: targetedOut.length,
    },
    authored: authoredOut,
    cosponsored: cosponsoredOut,
    targeted: targetedOut,
  });
}
