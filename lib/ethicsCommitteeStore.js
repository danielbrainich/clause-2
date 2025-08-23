// lib/ethicsCommitteeStore.js
// Flat canonical shape we will ALWAYS write:
// { items: { [key]: Bill }, lastUpdated: <ts> }

const STORE_NAME = "ethics-committee";
const STORE_KEY  = "store.json";

// --- utilities --------------------------------------------------------------

function nowTs() { return Date.now(); }

// try to detect "bill dictionary" vs wrapper
function looksLikeBillDict(obj) {
  if (!obj || typeof obj !== "object") return false;
  // if it has obvious non-bill keys, it's probably not a pure dict
  if ("items" in obj || "lastUpdated" in obj) return false;
  // heuristic: keys like "119:HRES:123"
  const keys = Object.keys(obj);
  return keys.length > 0 && keys.some(k => /:\w+:\d+/.test(k));
}

// migrate any legacy shapes into { items, lastUpdated }
function normalize(raw) {
  if (!raw || typeof raw !== "object") {
    return { items: {}, lastUpdated: null };
  }

  // Already flat?
  if (raw.items && typeof raw.items === "object") {
    return { items: raw.items, lastUpdated: raw.lastUpdated ?? null };
  }

  // Legacy nesting: { map: { items: {...}, lastUpdated }, lastUpdated }
  if (raw.map?.items) {
    return {
      items: raw.map.items || {},
      lastUpdated: raw.lastUpdated ?? raw.map.lastUpdated ?? null
    };
  }

  // Legacy: { map: { ...bills... } }
  if (raw.map && looksLikeBillDict(raw.map)) {
    return { items: raw.map, lastUpdated: raw.lastUpdated ?? null };
  }

  // Entire object is a dict of bills
  if (looksLikeBillDict(raw)) {
    return { items: raw, lastUpdated: null };
  }

  return { items: {}, lastUpdated: raw.lastUpdated ?? null };
}

// make a stable bill key
export function billKey(b) {
  return `${b.congress}:${String(b.type || "").toUpperCase()}:${b.number}`;
}

// --- Netlify Blobs + local fallback ----------------------------------------

async function readBlobJSON() {
  // Try Netlify Blobs
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const raw = await store.get(STORE_KEY, { type: "json" });
    return raw || null;
  } catch {
    // fall through to local file
  }

  // Local file fallback (dev)
  try {
    const fs = await import("node:fs/promises");
    const path = `./data/${STORE_NAME}.json`;
    const txt = await fs.readFile(path, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function writeBlobJSON(obj) {
  // Try Netlify Blobs
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.set(STORE_KEY, JSON.stringify(obj), {
      contentType: "application/json; charset=utf-8"
    });
    return true;
  } catch {
    // fall through to local file
  }

  // Local file fallback (dev)
  try {
    const fs = await import("node:fs/promises");
    const path = `./data/${STORE_NAME}.json`;
    await fs.mkdir("./data", { recursive: true });
    await fs.writeFile(path, JSON.stringify(obj, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

// --- Public API -------------------------------------------------------------

export async function loadStore() {
  const raw = await readBlobJSON();
  return normalize(raw);
}

export async function saveStore(store) {
  const flat = normalize(store);
  flat.lastUpdated = nowTs();
  await writeBlobJSON(flat);
  return flat;
}

export async function upsertBill(store, bill) {
  const flat = normalize(store);
  const key = billKey(bill);
  flat.items[key] = { ...(flat.items[key] || {}), ...bill, lastCached: nowTs() };
  return flat;
}
