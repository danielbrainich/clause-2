// lib/discipline-store-file.js
import fs from "fs/promises";
import path from "path";

const DB_PATH =
  process.env.DISCIPLINE_DB_PATH ||
  path.join(process.cwd(), ".data", "discipline.json");

async function ensureDir() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true }).catch(() => {});
}

function normType(t) { return String(t || "").trim().toUpperCase(); }
function normNum(n)  { return String(n || "").trim(); }

export function normalizeBill(b = {}) {
  const nb = { ...b, type: normType(b.type), number: normNum(b.number) };
  if (!nb.latestAction) nb.latestAction = null;
  return nb;
}
export function keyFor(b) {
  return `${b?.congress}-${normType(b?.type)}-${normNum(b?.number)}`;
}

function sortByLatestDesc(a, b) {
  const da = a?.latestAction?.actionDate ? Date.parse(a.latestAction.actionDate) : 0;
  const db = b?.latestAction?.actionDate ? Date.parse(b.latestAction.actionDate) : 0;
  return db - da;
}

async function readRaw() {
  try { return JSON.parse(await fs.readFile(DB_PATH, "utf8")); }
  catch { return { lastUpdated: 0, bills: [] }; }
}
async function writeRaw(data) {
  await ensureDir();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function replaceAllFile(bills) {
  const map = new Map();
  for (const raw of Array.isArray(bills) ? bills : []) {
    const nb = normalizeBill(raw);
    const k = keyFor(nb);
    if (!map.has(k)) map.set(k, nb);
  }
  const arr = Array.from(map.values()).sort(sortByLatestDesc);
  await writeRaw({ lastUpdated: Date.now(), bills: arr });
}

export async function upsertManyFile(bills) {
  const cur = await readRaw();
  const map = new Map(cur.bills.map((b) => [keyFor(b), normalizeBill(b)]));
  for (const raw of Array.isArray(bills) ? bills : []) {
    const nb = normalizeBill(raw);
    map.set(keyFor(nb), nb);
  }
  const arr = Array.from(map.values()).sort(sortByLatestDesc);
  await writeRaw({ lastUpdated: Date.now(), bills: arr });
}

export async function getSliceFile(cursor = 0, limit = 12) {
  const cur = await readRaw();
  const c = Math.max(0, Number(cursor) || 0);
  const l = Math.max(1, Math.min(100, Number(limit) || 12));
  const items = cur.bills.slice(c, c + l);
  const nextCursor = c + l < cur.bills.length ? c + l : null;
  return { items, nextCursor, total: cur.bills.length, lastUpdated: cur.lastUpdated };
}
