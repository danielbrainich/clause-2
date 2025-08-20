import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data");
const FILE = path.join(DATA_PATH, "ethics-committee.json");

export async function loadStore() {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    const json = JSON.parse(buf);
    // in-memory map keyed by billKey
    const map = new Map(Object.entries(json.map || {}));
    return { map, lastUpdated: json.lastUpdated || 0 };
  } catch {
    return { map: new Map(), lastUpdated: 0 };
  }
}

export async function saveStore(store) {
  await fs.mkdir(DATA_PATH, { recursive: true });
  const out = {
    lastUpdated: Date.now(),
    map: Object.fromEntries(store.map),
  };
  await fs.writeFile(FILE, JSON.stringify(out, null, 2));
}
