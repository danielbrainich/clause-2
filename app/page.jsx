"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cleanActionString } from "@/app/utils/utils";
import Spinner from "@/components/ui/Spinner";

export default function Home() {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(12); // keep in sync with API

  function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  function stageFromLatest(text = "") {
    const t = String(text).toLowerCase();
    if (/became public law|presented to president|signed/.test(t)) return "Law";
    if (/introduced/.test(t)) return "Introduced";
    return "Active";
  }

  useEffect(() => {
    let cancelled = false;
    const fetchBillsList = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/list-bills/${offset}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setBills((prev) => [...prev, ...(data?.bills ?? [])]);
          if (data?.pageSize) setPageSize(data.pageSize);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load bills.");
        console.error("Failed to fetch bills:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchBillsList();
    return () => {
      cancelled = true;
    };
  }, [offset]);

  const StageBadge = ({ stage }) => {
    const tones = {
      Law: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      Introduced:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      Active:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      default:
        "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
    };
    const tone = tones[stage] || tones.default;
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}
      >
        {stage}
      </span>
    );
  };

  const Card = ({ children, className = "" }) => (
    <div
      className={`flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md
                  dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  );

  // Tighter header; aligns divider across cards without extra height
  const CardHeader = ({ children, className = "" }) => (
    <div
      className={`border-b p-4 dark:border-neutral-800 ${className}`}
      style={{
        minHeight: "88px", // ~1 number line + 2 clamped name lines
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

  if (isLoading && bills.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex justify-center items-center gap-3 text-blue-600 dark:text-blue-400">
          <Spinner className="text-blue-600 dark:text-blue-400" />

          <span className="text-sm">Loading…</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl border p-6 text-sm text-rose-600 dark:border-neutral-800 dark:text-rose-400">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Page header */}
      <section className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
          Latest actions
        </h1>
        <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
          Recently acted-on bills across the House and Senate.
        </p>
      </section>

      {/* Responsive auto-fill grid */}
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {bills.map((bill, idx) => {
          const stage = stageFromLatest(bill?.latestAction?.text);
          const billNo = `${bill.type}-${bill.number}`;
          const chamber = bill.originChamber || bill.chamber || "—";
          const linkHref = `/bill/${bill.congress}/${bill.type}/${bill.number}`;
          const introduced =
            bill?.introducedDate ||
            bill?.introduced ||
            bill?.introDate ||
            bill?.latestAction?.actionDate ||
            null;

          return (
            <Link
              key={`${bill.congress}-${bill.type}-${bill.number}-${idx}`}
              href={linkHref}
            >
              <Card className="group">
                <CardHeader>
                  {/* Top line: number + chamber + stage badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em]">
                      {billNo}
                      <span className="ml-2 text-[12px] font-normal text-neutral-600 dark:text-neutral-400">
                        {chamber}
                      </span>
                    </h3>
                    <StageBadge stage={stage} />
                  </div>

                  {/* Name under it — clamp to 2 lines with fixed height (short & uniform) */}
                  <p
                    className="text-[14.5px] leading-snug font-medium"
                    title={bill?.title || billNo}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "2.6rem", // ~2 lines at leading-snug
                    }}
                  >
                    {bill?.title || billNo}
                  </p>
                </CardHeader>

                <CardContent>
                  {/* Latest action — clamp to 3 lines, fixed height for uniform rows */}
                  <p
                    className="text-[13px] leading-5"
                    title={cleanActionString(bill?.latestAction?.text)}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "3.75rem", // 3 * 1.25rem (leading-5)
                    }}
                  >
                    {cleanActionString(bill?.latestAction?.text)}
                  </p>

                  {/* Footer pinned to bottom */}
                  <div className="mt-auto pt-3 text-[12px] text-neutral-600 dark:text-neutral-400">
                    Introduced {formatDate(introduced)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Load more */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setOffset((prev) => prev + pageSize)}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-medium
                      hover:text-blue-900 hover:bg-neutral-50
                     dark:border-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-800"
        >
          SHOW MORE
        </button>
      </div>

      {isLoading && bills.length > 0 && (
        <p className="mt-3 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
          Loading more…
        </p>
      )}
    </main>
  );
}
