// app/api/list-bills/[offset]/route.js
import { NextResponse } from "next/server";
import { topicTags } from "@/lib/topic-tags";

const API_BASE    = "https://api.congress.gov/v3";
const PAGE_SIZE   = 12;
const LIST_LIMIT  = 50;
const MAX_SCANS   = 6;
const CONCURRENCY = 6;

// Normalize arrays safely (same as in tagger, kept local to avoid extra import)
function toArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (typeof x === "string") return [x];
  if (x && typeof x === "object") {
    if (Array.isArray(x.items)) return x.items;
    if (Array.isArray(x.legislativeSubjects)) return x.legislativeSubjects;
    if (Array.isArray(x.legislativeSubject)) return x.legislativeSubject;
    if (Array.isArray(x.committees)) return x.committees;
    if (Array.isArray(x.committee)) return x.committee;
  }
  return [];
}

// Fast pre-filter on the raw list page (no detail request needed)
function quickDisciplineHeuristicFromList(b) {
  const type = String(b?.type || "").toUpperCase();
  if (type !== "HRES" && type !== "SRES") return false;

  const title  = (b?.title || "").toLowerCase();
  const latest = (b?.latestAction?.text || "").toLowerCase();
  const text   = `${title} ${latest}`;

  const mentionsMember = /\b(representative|rep\.|senator|sen\.)\b/.test(text);
  const hitCensure     = /\bcensur(e|ed|ing)\b/.test(text);
  const hitReprimand   = /\breprimand(ed|ing)?\b/.test(text);
  const hitExpel       = /\bexpel(l|led|ling)?\b/.test(text);
  const hitCondemnMbr  = /\bcondemn(ing|s|ed)?\b/.test(text) && mentionsMember;

  return hitCensure || hitReprimand || hitExpel || hitCondemnMbr;
}

async function mapWithLimit(items, limit, mapper) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await mapper(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function GET(req, { params }) {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing CONGRESS_GOV_API_KEY" }, { status: 500 });
  }

  const startOffset = Number(params?.offset || 0) || 0;
  const urlIn = new URL(req.url);

  const topic   = (urlIn.searchParams.get("topic") || "discipline").toLowerCase();
  const strict  = urlIn.searchParams.get("strict") === "1"; // strict discipline only
  const days    = Number(urlIn.searchParams.get("days") || 120);
  const since   = new Date(Date.now() - days * 864e5);

  let rawOffset = startOffset;
  const matched = [];

  try {
    for (let scan = 0; scan < MAX_SCANS && matched.length < PAGE_SIZE; scan++) {
      const listURL = new URL(`${API_BASE}/bill`);
      listURL.searchParams.set("api_key", apiKey);
      listURL.searchParams.set("format", "json");
      listURL.searchParams.set("limit", String(LIST_LIMIT));
      listURL.searchParams.set("offset", String(rawOffset));

      const listRes = await fetch(listURL.toString(), { next: { revalidate: 600 } });
      if (!listRes.ok) {
        const body = await listRes.text();
        return NextResponse.json(
          { error: "Upstream list error", status: listRes.status, body: body.slice(0, 400) },
          { status: 502 }
        );
      }
      const listJson = await listRes.json();
      const items = Array.isArray(listJson?.bills) ? listJson.bills : [];
      if (items.length === 0) break;

      // Pre-filter candidates if discipline mode
      const candidates = topic === "discipline"
        ? items.filter(quickDisciplineHeuristicFromList)
        : items;

      // Enrich candidates with details (defensively)
      const enriched = await mapWithLimit(candidates, CONCURRENCY, async (b) => {
        try {
          const detailURL = `${API_BASE}/bill/${b.congress}/${b.type}/${b.number}?format=json&api_key=${apiKey}`;
          const detRes = await fetch(detailURL, { next: { revalidate: 1800 } });
          if (!detRes.ok) {
            // keep minimal info; mark detail error for debugging
            return { ...b, _detailError: detRes.status };
          }
          const det = await detRes.json();
          const bill = det?.bill || det || {};

          // normalize actions
          const actions = toArray(bill.actions?.items) ?? toArray(bill.actions);

          return {
            ...b,
            title: bill.title || b.title,
            latestAction: bill.latestAction || b.latestAction,
            policyArea: bill.policyArea || null,
            subjects: bill.subjects || null,
            committees: bill.committees || null,
            actions,
            congressdotgov_url: bill.congressdotgov_url || b.url || null,
            updateDate: b.updateDate || bill.updateDate || null,
          };
        } catch {
          return { ...b, _detailError: "fetch-failed" };
        }
      });

      for (const b of enriched) {
        // recency: prefer latestAction date; fallback to updateDate
        const actDate = b?.latestAction?.actionDate ? new Date(b.latestAction.actionDate) : null;
        const updDate = b?.updateDate ? new Date(b.updateDate) : null;
        const dt = actDate || updDate;
        if (dt && dt < since) continue;

        if (topic === "discipline") {
          // final strict gate using robust tagger
          const tags = topicTags(b, { strict: true });
          if (tags.includes("discipline")) {
            matched.push({ ...b, topics: ["discipline"] });
          }
        } else {
          matched.push({ ...b });
        }

        if (matched.length === PAGE_SIZE) break;
      }

      rawOffset += LIST_LIMIT;
    }

    const res = NextResponse.json({
      topic,
      strict: topic === "discipline" ? true : !!strict,
      pageSize: PAGE_SIZE,
      nextOffset: rawOffset,
      count: matched.length,
      bills: matched,
    });
    res.headers.set("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
