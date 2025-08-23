// lib/ethicsCommitteeStore.js
import fs from "node:fs/promises";
import path from "node:path";

const FILE_PATH = path.join(process.cwd(), "data", "ethics-committee.json");

// Lazy init of Netlify Blobs (works on Netlify runtime; falls back locally)
let blobs = null;
async function getBlobs() {
  if (blobs !== null) return blobs;
  try {
    const { getStore } = await import("@netlify/blobs");
    // one logical store for your app
    blobs = getStore({ name: "ethics-committee", scope: "app" });
  } catch {
    blobs = undefined; // not running on Netlify or package missing
  }
  return blobs;
}

function toState(obj) {
  // we persist as { lastUpdated, map: { key: record, ... } }
  const rawMap = obj?.map ?? obj ?? {};
  const map = new Map(Object.entries(rawMap));
  return {
    map,
    lastUpdated: obj?.lastUpdated ?? 0,
    total: map.size,
  };
}

export async function loadStore() {
  // Try Netlify blobs first
  const store = await getBlobs();
  if (store) {
    const text = await store.get("store.json");
    if (text) return toState(JSON.parse(text));
    return { map: new Map(), lastUpdated: 0, total: 0 };
  }

  // Fallback: local JSON for dev
  try {
    const text = await fs.readFile(FILE_PATH, "utf8");
    return toState(JSON.parse(text));
  } catch {
    return { map: new Map(), lastUpdated: 0, total: 0 };
  }
}

export async function saveStore(state) {
  const payload = JSON.stringify(
    {
      lastUpdated: Date.now(),
      map: Object.fromEntries(state.map),
    },
    null,
    0
  );

  const store = await getBlobs();
  if (store) {
    await store.set("store.json", payload, {
      contentType: "application/json",
    });
    return true;
  }

  // Fallback local save (dev)
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, payload, "utf8");
  return true;
}
