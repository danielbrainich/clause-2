// netlify/functions/ethics-refresh.js

// Helper: choose correct site URL (prod, preview, or local dev)
function getBaseUrl() {
  return (
    process.env.URL ||               // Netlify sets this on production
    process.env.DEPLOY_PRIME_URL ||  // Netlify sets this on branch/preview
    "http://localhost:8888"          // Local when running `netlify dev`
  );
}

module.exports = async (req) => {
  const base = getBaseUrl();

  // Optional secret if your /api/ethics/refresh requires it
  const secret = process.env.CRON_SECRET;

  const params = new URLSearchParams({
    days: "90",
    limit: "250",
    pages: "40",
    wide: "1",
    confirm: "1"
  });
  if (secret) params.set("token", secret);

  // allow manual `?log=1` to pass through
  if (req && new URL(req.url).searchParams.get("log") === "1") {
    params.set("log", "1");
  }

  // Add a timeout guard
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 25_000);

  try {
    const url = `${base}/api/ethics/refresh?${params.toString()}`;
    const res = await fetch(url, { signal: ac.signal });
    const data = await res.json().catch(() => ({}));
    clearTimeout(t);

    return new Response(
      JSON.stringify({
        ok: res.ok,
        called: url,
        upstream: data
      }),
      {
        status: res.ok ? 200 : res.status,
        headers: { "content-type": "application/json" }
      }
    );
  } catch (err) {
    clearTimeout(t);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

// Netlify schedule (CRON syntax, UTC time)
module.exports.config = {
  schedule: "0 13 * * *" // every day at 13:00 UTC (~6am PT)
};
