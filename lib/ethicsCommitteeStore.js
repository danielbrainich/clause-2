// lib/ethicsCommitteeStore.js
import path from "node:path";
import fs from "node:fs/promises";

let blobs = null;
try {
  // Only available on Netlify runtime / server builds
  const { getStore } = await import("@netlify/blobs");
  // Name your store; you can also set NETLIFY_BLOBS_STORE_ID in env
  const STORE_ID = process.env.NETLIFY_BLOBS_STORE_ID || "ethics-committee";
  blobs = getStore(STORE_ID);
} catch {
  // not on Netlify or package not available; we'll use file fallback
}

const FILE_PATH =
  process.env.ETHICS_STORE_FILE ||
  path.join(process.cwd(), "data", "ethics-committee.json");

const BLOB_KEY = "store.json";

// shape helpers
function normalizeToMap(parsed) {
  if (!parsed) return new Map();

  // { map: [ [k,v], ... ] }
  if (parsed.map && Array.isArray(parsed.map)) return new Map(parsed.map);

  // plain object
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    return new Map(Object.entries(parsed));
  }

  // array of bills => key them
  if (Array.isArray(parsed)) {
    const m = new Map();
    for (const b of parsed) {
      const k = `${b?.congress}:${String(b?.type || "").toUpperCase()}:${b?.number}`;
      m.set(k, b);
    }
    return m;
  }
  return new Map();
}

export async function loadStore() {
  // Prefer Netlify Blobs in prod
  if (blobs) {
    try {
      const json = await blobs.get(BLOB_KEY, { type: "json" });
      if (json) return { map: normalizeToMap(json), driver: "netlify-blobs" };
    } catch (e) {
      console.warn("[store] blobs read failed -> file fallback:", e.message);
    }
  }

  // File fallback (dev/local)
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { map: normalizeToMap(parsed), driver: "file", path: FILE_PATH };
  } catch {
    return { map: new Map(), driver: "file", path: FILE_PATH, note: "new store" };
  }
}

export async function saveStore(store) {
  const serial = { map: Array.from(store.map.entries()) };

  // Netlify Blobs first
  if (blobs) {
    await blobs.set(BLOB_KEY, serial);
    return { ok: true, driver: "netlify-blobs" };
  }

  // File fallback
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(Object.fromEntries(store.map), null, 2), "utf8");
  return { ok: true, driver: "file", path: FILE_PATH };
}
