// lib/ethicsCommitteeStore.js (drop-in change)
import fs from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), "data", "ethics-committee.json");

export async function loadStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const obj = JSON.parse(raw);
    // normalize to { map: Map, count }
    const entries = Object.entries(obj.map || obj || {});
    return {
      map: new Map(entries),
      count: entries.length,
      lastUpdated: obj.lastUpdated || Date.now(),
    };
  } catch {
    return { map: new Map(), count: 0, lastUpdated: 0 };
  }
}

export async function saveStore() {
  // In production on Vercel, don't attempt to write.
  if (process.env.VERCEL) return false;
  // Locally, allow writes (so you can reseed & commit)
  return true;
}
