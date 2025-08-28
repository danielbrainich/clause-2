exports.config = { schedule: "0 13 * * *" };

exports.handler = async (event) => {
  const qs = event.queryStringParameters || {};
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

  const days  = qs.days  ?? "3";
  const limit = qs.limit ?? "250";
  const pages = qs.pages ?? "40";
  const wide  = qs.wide  ?? "1";
  const dry   = qs.dry === "1";
  const log   = qs.log === "1";

  const params = new URLSearchParams({
    days, limit, pages, wide,
    confirm: dry ? "0" : "1",
  });
  if (log) params.set("log", "1");

  const refreshUrl = `${base}/api/ethics/refresh?${params.toString()}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 25_000);

  try {
    const r = await fetch(refreshUrl, { signal: ac.signal, headers: { "cache-control": "no-store" } });
    clearTimeout(timer);

    // Read body as text first so we can show it even on non-OK responses
    const bodyText = await r.text().catch(() => "");
    let parsed = null;
    try { parsed = JSON.parse(bodyText); } catch {}

    const payload = {
      ok: r.ok,
      status: r.status,
      statusText: r.statusText,
      ran: "ethics-refresh",
      refreshUrl,
      upstream: parsed ?? bodyText, // show JSON or raw text
    };

    return {
      statusCode: r.ok ? 200 : r.status || 502,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload, null, 2),
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      statusCode: 502,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(err), refreshUrl }, null, 2),
    };
  }
};
