const API_BASE = "https://api.congress.gov/v3";

export async function fetchBillCommittees({ congress, type, number, apiKey }) {
  const u = new URL(`${API_BASE}/bill/${congress}/${String(type).toLowerCase()}/${number}/committees`);
  u.searchParams.set("format", "json");
  u.searchParams.set("api_key", apiKey);
  const r = await fetch(u.toString(), { cache: "no-store" });
  if (!r.ok) return null;
  const j = await r.json();
  // Congress.gov returns { committees: [ { name: "...", chamberCode: "...", ... }, ... ] }
  const items = Array.isArray(j?.committees) ? j.committees : (Array.isArray(j?.committee) ? j.committee : []);
  return items;
}
