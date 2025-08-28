// Run daily at 13:00 UTC
exports.config = {
  schedule: "0 13 * * *",
};

/**
 * Netlify Function handler
 * - Manual run:  /.netlify/functions/ethics-refresh?dry=1&log=1
 * - Scheduled run: Netlify invokes it in production on the cron above
 */
exports.handler = async (event, context) => {
  const qs = event.queryStringParameters || {};
  const isDry = qs.dry === "1";

  // Base URL of this deploy (prod: URL, previews: DEPLOY_PRIME_URL, dev: 8888)
  const base =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:8888";

  // Defaults (you can override via querystring when running manually)
  const days  = qs.days  ?? "3";
  const limit = qs.limit ?? "250";
  const pages = qs.pages ?? "40";
  const wide  = qs.wide  ?? "1";
  const log   = qs.log   === "1";

  const params = new URLSearchParams({
    days, limit, pages, wide,
    confirm: isDry ? "0" : "1",
  });
  if (log) params.set("log", "1");

  const refreshUrl = `${base}/api/ethics/refresh?${params.toString()}`;

  // Timeout guard so the function doesn’t hang
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 25_000);

  try {
    const r = await fetch(refreshUrl, { signal: ac.signal, headers: { "cache-control": "no-store" } });
    clearTimeout(timer);

    const upstream = await r.json().catch(() => ({}));
    const body = JSON.stringify({
      ok: r.ok,
      ran: "ethics-refresh",
      refreshUrl,
      upstream,
    });

    return {
      statusCode: r.ok ? 200 : r.status || 502,
      headers: { "content-type": "application/json" },
      body,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      statusCode: 502,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(err), refreshUrl }),
    };
  }
};
