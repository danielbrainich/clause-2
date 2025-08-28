// lib/ethicsCommitteeStore.js
import ethicsJSON from "@/data/ethics-committee.json";

// Optional import of Netlify Blobs only in prod
let blobs;
if (process.env.NODE_ENV === "production") {
  try {
    blobs = await import("@netlify/blobs");
  } catch {
    blobs = null;
  }
}

const STORE_NAME = "ethics-committee";
const STORE_KEY  = "store.json";

/**
 * Always returns an object with shape:
 * { map: <plain object of keyed bills>, lastUpdated: <number> }
 */
export async function loadStore() {
  // DEV/preview: use the baked JSON file so you always have data locally.
  if (process.env.NODE_ENV !== "production") {
    // Support both {map:{...}} and {...} shapes in the JSON file.
    if (ethicsJSON?.map) return { map: ethicsJSON.map, lastUpdated: ethicsJSON.lastUpdated || Date.now() };
    return { map: ethicsJSON || {}, lastUpdated: Date.now() };
  }

  // PRODUCTION: try Netlify Blobs
  if (blobs?.getStore) {
    try {
      const store = blobs.getStore(STORE_NAME);
      const json = await store.get(STORE_KEY, { type: "json", consistency: "strong" });
      if (json?.map) return json;
    } catch (e) {
      console.warn("[loadStore] blobs get failed:", e?.message || e);
    }
  }

  // Fallback to baked JSON even in prod (so you never get an empty UI)
  if (ethicsJSON?.map) return { map: ethicsJSON.map, lastUpdated: ethicsJSON.lastUpdated || Date.now() };
  return { map: ethicsJSON || {}, lastUpdated: Date.now() };
}

export async function saveStore(data) {
  // Only write in production; in dev the source is the JSON file.
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, skipped: "dev-mode (using baked JSON)" };
  }
  if (!blobs?.getStore) return { ok: false, error: "Netlify Blobs not available" };

  try {
    const store = blobs.getStore(STORE_NAME);
    await store.setJSON(STORE_KEY, data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
