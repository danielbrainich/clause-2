// lib/ethicsCommitteeStore.js
import fs from "fs/promises";
import path from "path";

const STORE_NAME = "ethics-committee";   // Netlify Blobs store name
const STORE_KEY  = "store.json";         // key inside the store

function isProdNetlify() {
  // Netlify sets NETLIFY env var for Functions. You can also use process.env.VERCEL etc. if you ever move.
  return !!process.env.NETLIFY;
}

function toMap(obj) {
  // normalize into a Map
  if (obj instanceof Map) return obj;
  return new Map(Object.entries(obj || {}));
}

function fromMap(m) {
  // normalize out of a Map
  return m instanceof Map ? Object.fromEntries(m) : (m || {});
}

async function readLocal() {
  const file = path.resolve(process.cwd(), "data/ethics-committee.json");
  try {
    const txt = await fs.readFile(file, "utf8");
    const json = JSON.parse(txt);

    // MIGRATION: if someone saved { map: { items: {...} } }, flatten it.
    const rawMap =
      json?.map?.items && typeof json.map.items === "object"
        ? json.map.items
        : json?.map || {};

    return {
      lastUpdated: json?.lastUpdated || 0,
      map: toMap(rawMap),
    };
  } catch (e) {
    // empty fresh store
    return { lastUpdated: 0, map: new Map() };
  }
}

async function writeLocal(store) {
  const file = path.resolve(process.cwd(), "data/ethics-committee.json");
  const payload = {
    lastUpdated: store?.lastUpdated || Date.now(),
    map: fromMap(store?.map),
  };
  await fs.mkdir(path.dirname(file), { recursive: true }).catch(() => {});
  await fs.writeFile(file, JSON.stringify(payload, null, 2));
}

export async function loadStore() {
  // PROD: Netlify Blobs
  if (isProdNetlify()) {
    try {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore(STORE_NAME);

      // type:"json" returns parsed JSON or null if missing
      let json = await store.get(STORE_KEY, { type: "json" });

      if (!json) {
        // first run
        return { lastUpdated: 0, map: new Map() };
      }

      // MIGRATION: flatten map.items if present
      const rawMap =
        json?.map?.items && typeof json.map.items === "object"
          ? json.map.items
          : json?.map || {};

      return {
        lastUpdated: json?.lastUpdated || 0,
        map: toMap(rawMap),
      };
    } catch (e) {
      console.warn("[store] blob read failed, falling back to local:", e);
      return readLocal();
    }
  }

  // DEV/LOCAL
  return readLocal();
}

export async function saveStore(store) {
  const payload = {
    lastUpdated: Date.now(),
    map: fromMap(store?.map),
  };

  // PROD: Netlify Blobs
  if (isProdNetlify()) {
    try {
      const { getStore } = await import("@netlify/blobs");
      const s = getStore(STORE_NAME);
      await s.setJSON(STORE_KEY, payload, {
        metadata: { lastUpdated: String(payload.lastUpdated) },
      });
      return true;
    } catch (e) {
      console.warn("[store] blob write failed, writing local:", e);
      await writeLocal(payload);
      return false;
    }
  }

  // DEV/LOCAL
  await writeLocal(payload);
  return true;
}
