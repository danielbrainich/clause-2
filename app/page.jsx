// app/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { cleanActionString } from "@/app/utils/utils";

const inter = Inter({ subsets: ["latin"] });

// tiny neutral spinner
function InlineSpinner({ size = "sm" }) {
  const sizes = {
    xs: "h-3 w-3 border",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
  };
  return (
    <span
      className="inline-flex items-center"
      role="status"
      aria-label="Loading"
    >
      <span
        className={`${sizes[size]} animate-spin rounded-full border-t-transparent border-neutral-300 dark:border-neutral-700`}
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
function stageFromLatest(text = "") {
  const t = String(text).toLowerCase();
  if (/became public law|signed|presented to president/.test(t)) return "Law";
  if (/passed (house|senate)/.test(t)) return "Passed";
  if (/introduced/.test(t)) return "Introduced";
  return "Active";
}

// UI primitives
const StageBadge = ({ stage }) => (
  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
    {stage}
  </span>
);
const Card = ({ children, className = "" }) => (
  <div
    className={`group flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
  >
    {children}
  </div>
);
const CardHeader = ({ children, className = "" }) => (
  <div
    className="border-b p-4 dark:border-neutral-800"
    style={{
      minHeight: "88px",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}
  >
    {children}
  </div>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`flex grow flex-col p-4 ${className}`}>{children}</div>
);

// ---------- HOMEPAGE ----------
export default function Home() {
  const PAGE_SIZE = 12;

  const [bills, setBills] = useState([]); // what we render
  const [nextCursor, setNextCursor] = useState(0);
  const [total, setTotal] = useState(0);
  const [stale, setStale] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState(null);

  // Helper: fetch one feed page
  async function fetchFeed(cursor) {
    const res = await fetch(
      `/api/discipline/feed/${cursor}?limit=${PAGE_SIZE}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
    const data = await res.json();
    // Defensive shape
    const items = Array.isArray(data?.items) ? data.items : [];
    return {
      items,
      nextCursor: data?.nextCursor ?? null,
      total: data?.total ?? 0,
      stale: !!data?.stale,
    };
  }

  // Helper: dedupe client-side by normalized key (belt & suspenders)
  function uniqueByKey(list) {
    const seen = new Set();
    const out = [];
    for (const b of list) {
      const k = `${b?.congress}-${String(b?.type || "").toUpperCase()}-${String(
        b?.number || ""
      )}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(b);
      }
    }
    return out;
  }

  // Fill up to at least `want` items by stitching subsequent pages if needed
  async function fillAtLeast(want, startCursor = 0) {
    let acc = [];
    let cursor = startCursor;
    let total = 0;
    let staleFlag = false;

    while (acc.length < want && cursor !== null) {
      const page = await fetchFeed(cursor);
      total = page.total;
      staleFlag = page.stale;

      // append & dedupe
      acc = uniqueByKey(acc.concat(page.items));
      cursor = page.nextCursor;
      // If the feed ever returned fewer than requested but we still have nextCursor,
      // loop will continue and stitch more until we reach `want` or run out.
    }

    return { acc, cursor, total, stale: staleFlag };
  }

  // INITIAL LOAD — always try to fill 12
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const { acc, cursor, total, stale } = await fillAtLeast(PAGE_SIZE, 0);
        if (cancelled) return;
        setBills(acc);
        setNextCursor(cursor);
        setTotal(total);
        setStale(stale);
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // LOAD MORE — add another PAGE_SIZE visible items by stitching as needed
  async function loadMore() {
    if (nextCursor == null || loadingMore) return;
    try {
      setLoadingMore(true);
      setErr(null);

      const target = bills.length + PAGE_SIZE;

      let acc = bills.slice();
      let cursor = nextCursor;
      let currentTotal = total; 
      let currentStale = stale;

      while (acc.length < target && cursor !== null) {
        const page = await fetchFeed(cursor);
        currentTotal = page.total;
        currentStale = page.stale;
        acc = uniqueByKey(acc.concat(page.items));
        cursor = page.nextCursor;
      }

      setBills(acc);
      setNextCursor(cursor);
      setTotal(currentTotal);
      setStale(currentStale);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading && bills.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
          <InlineSpinner size="md" />
          <span className="text-sm">Loading…</span>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl border p-6 text-sm text-rose-600 dark:border-neutral-800 dark:text-rose-400">
          {String(err)}
        </div>
      </main>
    );
  }

  return (
    <main className={`${inter.className} mx-auto max-w-7xl px-4 py-6`}>
      <section className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
          Capitol Drama
        </h1>
        <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
          Censures, reprimands, expulsions, and condemnations (H.Res./S.Res.),
          newest first.
        </p>
        {stale && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] dark:border-neutral-800">
            Feed is stale.&nbsp;
            <a
              href="/api/discipline/refresh?days=1825&pages=60&limit=200&strict=1"
              className="underline hover:no-underline"
              target="_blank"
            >
              Refresh now
            </a>
          </div>
        )}
      </section>

      {bills.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
          No discipline activity found yet. Try refresh.
        </div>
      ) : null}

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {bills.map((bill, idx) => {
          const stage = stageFromLatest(bill?.latestAction?.text);
          const billNo = `${bill.type}-${bill.number}`;
          const chamber = bill.originChamber || bill.chamber || "—";
          const linkHref = `/bill/${bill.congress}/${bill.type}/${bill.number}`;
          const introduced =
            bill?.introducedDate ||
            bill?.introDate ||
            bill?.latestAction?.actionDate ||
            null;

          return (
            <Link
              key={`${bill.congress}-${bill.type}-${bill.number}-${idx}`}
              href={linkHref}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em]">
                      {billNo}
                      <span className="ml-2 text-[12px] font-normal text-neutral-600 dark:text-neutral-400">
                        {chamber}
                      </span>
                    </h3>
                    <StageBadge stage={stage} />
                  </div>
                  <p
                    className="text-[14.5px] font-medium leading-snug"
                    title={bill?.title || billNo}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "2.6rem",
                    }}
                  >
                    {bill?.title || billNo}
                  </p>
                </CardHeader>

                <CardContent>
                  <p
                    className="text-[13px] leading-5"
                    title={cleanActionString(bill?.latestAction?.text)}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "3.75rem",
                    }}
                  >
                    {cleanActionString(bill?.latestAction?.text)}
                  </p>
                  <div className="mt-auto pt-3 text-[12px] text-neutral-600 dark:text-neutral-400">
                    Introduced {formatDate(introduced)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        {nextCursor != null ? (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            aria-busy={loadingMore ? "true" : "false"}
            className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-[12.5px]
                       text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
                       disabled:cursor-not-allowed disabled:opacity-60
                       dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {loadingMore ? (
              <>
                <InlineSpinner size="sm" />
                <span>Loading…</span>
              </>
            ) : (
              <span>Show more</span>
            )}
          </button>
        ) : (
          <div className="text-[12px] text-neutral-500 dark:text-neutral-400">
            End of feed
          </div>
        )}
      </div>
    </main>
  );
}
