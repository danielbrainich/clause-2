// lib/ethicsCommitteeStore.js
// Persistent store for ethics data using Netlify Blobs.
// Shape is compatible with your existing callers: { map: Map<key, value>, lastUpdated?: number }

const BLOB_STORE_NAME = "ethics-committee";
const BLOB_KEY = "store.json";

// Convert Map <-> plain object
const toObj = (map) => Object.fromEntries(map instanceof Map ? map : new Map());
const toMap = (obj) => new Map(Object.entries(obj || {}));

// Fallback (dev or platforms without Blobs)
function getInMemory() {
  if (!globalThis.__ETHICS_STORE) {
    globalThis.__ETHICS_STORE = { map: new Map(), lastUpdated: 0 };
  }
  return globalThis.__ETHICS_STORE;
}

export async function loadStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore(BLOB_STORE_NAME);
    const json = await store.get(BLOB_KEY, { type: "json" }); // returns parsed JSON or null
    if (!json) return { map: new Map(), lastUpdated: 0 };
    return {
      map: toMap(json.items),
      lastUpdated: Number(json.lastUpdated || 0),
    };
  } catch {
    // local dev or not on Netlify — just use in-memory
    return getInMemory();
  }
}

export async function saveStore(data) {
  const payload = {
    items: toObj(data.map || new Map()),
    lastUpdated: Date.now(),
  };
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore(BLOB_STORE_NAME);
    await store.setJSON(BLOB_KEY, payload);
    return true;
  } catch {
    // in dev or no blobs: keep ephemeral in memory
    const mem = getInMemory();
    mem.map = new Map(Object.entries(payload.items));
    mem.lastUpdated = payload.lastUpdated;
    return false;
  }
}

// Optional helpers
export async function clearStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore(BLOB_STORE_NAME);
    await store.delete(BLOB_KEY);
  } catch {
    const mem = getInMemory();
    mem.map = new Map();
    mem.lastUpdated = 0;
  }
}

export async function getStoreMeta() {
  const s = await loadStore();
  return { size: s.map.size, lastUpdated: s.lastUpdated };
}
