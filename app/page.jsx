"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { cleanActionString } from "@/app/utils/utils";

const inter = Inter({ subsets: ["latin"] });

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

const CardHeader = ({ children }) => (
  <div
    className="border-b p-4 dark:border-neutral-800"
    style={{
      minHeight: 88,
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}
  >
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="flex grow flex-col p-4">{children}</div>
);

export default function Home() {
  const PAGE_SIZE = 12;

  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState(null);

  async function fetchFeed(cur) {
    const res = await fetch(`/api/ethics/feed/${cur}?limit=${PAGE_SIZE}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await fetchFeed(0);
        if (cancelled) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setCursor(data?.nextCursor ?? null);
        setNextCursor(data?.nextCursor ?? null);
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    if (loadingMore || nextCursor == null) return;
    try {
      setLoadingMore(true);
      const data = await fetchFeed(nextCursor);
      setItems((prev) =>
        prev.concat(Array.isArray(data?.items) ? data.items : [])
      );
      setCursor(data?.nextCursor ?? null);
      setNextCursor(data?.nextCursor ?? null);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading && items.length === 0) {
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
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {items.map((bill, idx) => {
          const lastActionText = cleanActionString(bill?.latestAction?.text);
          const lastActionDate = bill?.latestAction?.actionDate || null;
          const stage = stageFromLatest(bill?.latestAction?.text);
          const billNo = `${bill.type}-${bill.number}`;
          const chamberRaw = bill.originChamber || bill.chamber || "—";
          const chamber =
            chamberRaw === "House" ? "House of Representatives" : chamberRaw;
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
              prefetch={false}
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
                    {/* <StageBadge stage={stage} /> */}
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
                  {/* Label + date */}
                  <div className="mb-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                    Latest Action
                    {lastActionDate ? ` • ${formatDate(lastActionDate)}` : ""}
                  </div>

                  {/* Action text (clamped) */}
                  <p
                    className="text-[13px] leading-5"
                    title={lastActionText}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "3.75rem",
                    }}
                  >
                    {lastActionText || "—"}
                  </p>

                  {/* Introduced line stays as-is */}
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
        <button
          onClick={loadMore}
          disabled={loadingMore || nextCursor == null}
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
          ) : nextCursor == null ? (
            <span>End of feed</span>
          ) : (
            <span>Show more</span>
          )}
        </button>
      </div>
    </main>
  );
}
