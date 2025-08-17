// lib/discipline-store.js
let _cache = {
  bills: [],        // normalized, unique, sorted
  lastUpdated: 0,   // ms epoch
};

// ----- normalization / keys -----
function normType(t) {
  return String(t || "").trim().toUpperCase();
}
function normNum(n) {
  return String(n || "").trim();
}
export function normalizeBill(b = {}) {
  // normalize common fields we key/sort on
  const nb = {
    ...b,
    type: normType(b.type),
    number: normNum(b.number),
  };
  // ensure latestAction shape exists to avoid crashes when sorting
  if (!nb.latestAction) nb.latestAction = null;
  return nb;
}
export function keyFor(b) {
  return `${b?.congress}-${normType(b?.type)}-${normNum(b?.number)}`;
}

// ----- sorting newest first by latest action date -----
function sortByLatestDesc(a, b) {
  const da = a?.latestAction?.actionDate ? Date.parse(a.latestAction.actionDate) : 0;
  const db = b?.latestAction?.actionDate ? Date.parse(b.latestAction.actionDate) : 0;
  return db - da;
}

// Replace cache with unique, normalized, sorted list
export function replaceAll(bills) {
  const map = new Map();
  for (const raw of Array.isArray(bills) ? bills : []) {
    const nb = normalizeBill(raw);
    const k = keyFor(nb);
    if (!map.has(k)) map.set(k, nb); // keep first seen (usually newest due to scan order)
  }
  _cache.bills = Array.from(map.values()).sort(sortByLatestDesc);
  _cache.lastUpdated = Date.now();
}

export function getSlice(cursor = 0, limit = 12) {
  const c = Math.max(0, Number(cursor) || 0);
  const l = Math.max(1, Math.min(100, Number(limit) || 12));
  const items = _cache.bills.slice(c, c + l);
  const nextCursor = c + l < _cache.bills.length ? c + l : null;
  return { items, nextCursor, total: _cache.bills.length, lastUpdated: _cache.lastUpdated };
}

export function isStale(maxAgeMs = 15 * 60 * 1000) {
  return Date.now() - _cache.lastUpdated > maxAgeMs || _cache.bills.length === 0;
}
