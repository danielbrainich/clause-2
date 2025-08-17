// components/search/SearchDialog.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearch } from "./SearchProvider";

// Bill types for the dropdown
const BILL_TYPES = [
  "HR",
  "HRES",
  "HJRES",
  "HCONRES",
  "S",
  "SRES",
  "SJRES",
  "SCONRES",
];

// small helpers
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
function clean(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/^Latest Action:\s*/i, "")
    .trim();
}

// Compact spinner
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

export default function SearchDialog() {
  const { open, closeDialog } = useSearch();

  // tabs: "bills" | "members"
  const [tab, setTab] = useState("bills");

  // Bills form state
  const [congress, setCongress] = useState("119");
  const [billType, setBillType] = useState("HR");
  const [number, setNumber] = useState("");
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState("");
  const [billResult, setBillResult] = useState(null); // object or null

  // Legislators form state
  const [allReps, setAllReps] = useState([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [memLoading, setMemLoading] = useState(false);
  const [memError, setMemError] = useState("");
  const [memResults, setMemResults] = useState([]);

  // Reset content each time dialog opens
  useEffect(() => {
    if (!open) return;
    // reset errors and loading
    setBillError("");
    setBillLoading(false);
    setBillResult(null);
    setMemError("");
    setMemLoading(false);
    setMemResults([]);
    // don't clear congress/billType number between openings for convenience
  }, [open]);

  // Lazy-load legislators list the first time the "Members" tab is opened
  useEffect(() => {
    if (!open || tab !== "members" || membersLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        setMemLoading(true);
        setMemError("");
        const res = await fetch("/api/rep");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setAllReps(Array.isArray(data) ? data : []);
        setMembersLoaded(true);
      } catch (e) {
        if (!cancelled) setMemError("Could not load legislators list.");
        console.error("load members error:", e);
      } finally {
        if (!cancelled) setMemLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, membersLoaded]);

  // Search bills submit
  const submitBill = async (e) => {
    e?.preventDefault?.();
    setBillError("");
    setBillResult(null);
    // basic validation
    const cg = String(congress || "").trim();
    const bt = String(billType || "")
      .toUpperCase()
      .trim();
    const num = String(number || "").trim();
    if (!/^\d{1,3}$/.test(cg))
      return setBillError("Congress should be a number (e.g., 119).");
    if (!BILL_TYPES.includes(bt))
      return setBillError("Pick a valid bill type.");
    if (!/^\d{1,5}$/.test(num))
      return setBillError("Bill number should be 1–5 digits.");

    setBillLoading(true);
    try {
      const res = await fetch(`/api/show-bill/${cg}/${bt}/${num}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBillResult(data?.bill ?? null);
      if (!data?.bill) setBillError("No bill found with those details.");
    } catch (e) {
      console.error("bill search error:", e);
      setBillError("Could not fetch bill.");
    } finally {
      setBillLoading(false);
    }
  };

  // Search legislators submit (client-side filter)
  const normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  const submitMembers = (e) => {
    e?.preventDefault?.();
    setMemError("");
    setMemResults([]);
    const needle = normalize(q);
    if (!needle) return setMemResults([]);
    const results = allReps.filter((o) => normalize(o?.name).includes(needle));
    setMemResults(results);
  };

  // Layout guards
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={closeDialog}
    >
      <div
        className="mt-16 w-full max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + close */}
        <div className="flex items-center justify-between border-b p-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 opacity-70"
            >
              <path
                d="m21 21-4.3-4.3M3 11a8 8 0 1 0 16 0A8 8 0 0 0 3 11Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-[14.5px] font-medium">Search</div>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b p-2 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setTab("bills")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "bills"
                ? "bg-neutral-100 dark:bg-neutral-800"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Bills
          </button>
          <button
            type="button"
            onClick={() => setTab("members")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "members"
                ? "bg-neutral-100 dark:bg-neutral-800"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Legislators
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-3">
          {tab === "bills" ? (
            <div className="grid gap-3">
              {/* Form */}
              <form
                onSubmit={submitBill}
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                {/* Congress */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="dlg-congress"
                    className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    Congress
                  </label>
                  <input
                    id="dlg-congress"
                    inputMode="numeric"
                    placeholder="e.g. 119"
                    value={congress}
                    onChange={(e) =>
                      setCongress(e.target.value.replace(/[^\d]/g, ""))
                    }
                    required
                    className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-neutral-800 dark:bg-neutral-900"
                  />
                </div>

                {/* Bill type */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="dlg-billtype"
                    className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    Bill type
                  </label>
                  <select
                    id="dlg-billtype"
                    value={billType}
                    onChange={(e) => setBillType(e.target.value.toUpperCase())}
                    required
                    className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {BILL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="dlg-number"
                    className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    Number
                  </label>
                  <input
                    id="dlg-number"
                    inputMode="numeric"
                    placeholder="e.g. 35"
                    value={number}
                    onChange={(e) =>
                      setNumber(e.target.value.replace(/[^\d]/g, ""))
                    }
                    required
                    className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-neutral-800 dark:bg-neutral-900"
                  />
                </div>

                {/* Submit + error */}
                <div className="sm:col-span-3 flex items-center justify-between">
                  {billError ? (
                    <div className="text-[12px] text-rose-600 dark:text-rose-400">
                      {billError}
                    </div>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-medium
             text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
             dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
                    disabled={memLoading || !membersLoaded}
                  >
                    {memLoading ? <InlineSpinner size="xs" /> : null}
                    Search
                  </button>
                </div>
              </form>

              {/* Result */}
              <div className="pt-1">
                {billLoading ? null : billResult ? (
                  <BillResultCard
                    bill={billResult}
                    onOpen={() => closeDialog()}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {/* Form */}
              <form
                onSubmit={submitMembers}
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label
                    htmlFor="dlg-member-q"
                    className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    Legislator name
                  </label>
                  <input
                    id="dlg-member-q"
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. Ritchie Torres"
                    required
                    className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-neutral-800 dark:bg-neutral-900"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-medium
             text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
             dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
                    disabled={memLoading || !membersLoaded}
                  >
                    {memLoading ? <InlineSpinner size="xs" /> : null}
                    Search
                  </button>
                </div>
              </form>

              {/* Info / error */}
              {!membersLoaded && memLoading && (
                <div className="text-[12px] text-neutral-600 dark:text-neutral-400">
                  Loading legislators list…
                </div>
              )}
              {memError && (
                <div className="text-[12px] text-rose-600 dark:text-rose-400">
                  {memError}
                </div>
              )}

              {/* Results */}
              {memResults.length > 0 ? (
                <ul className="grid gap-2">
                  {memResults.slice(0, 20).map((m, i) => (
                    <li key={`${m?.bioguideId ?? i}-${i}`}>
                      <Link
                        href={`/pol/${m?.bioguideId ?? ""}`}
                        onClick={closeDialog}
                        className="flex items-center justify-between rounded-xl border p-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                      >
                        <div className="truncate">
                          <div className="text-[15px] font-medium truncate">
                            {m?.name || "—"}
                          </div>
                          {m?.state || m?.party ? (
                            <div className="text-[12px] text-neutral-600 dark:text-neutral-400">
                              {[m?.state, m?.party].filter(Boolean).join(" • ")}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-[12px] text-neutral-500">View</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : membersLoaded && q.trim() && !memLoading ? (
                <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
                  No matches.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t p-2 text-[12px] text-neutral-500 dark:border-neutral-800">
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Inline result card for a single bill --- */
function BillResultCard({ bill, onOpen }) {
  const congress = bill?.congress ?? bill?.congresses?.[0] ?? "";
  const type = bill?.type ?? "";
  const number = bill?.number ?? "";
  const href = `/bill/${congress}/${type}/${number}`;
  const billNo = `${type}-${number}`;
  const introduced =
    bill?.introducedDate ||
    bill?.introduced ||
    bill?.introDate ||
    bill?.latestAction?.actionDate ||
    null;

  const lastActionText = clean(bill?.latestAction?.text || bill?.latestAction || "");
  const lastActionDate = bill?.latestAction?.actionDate || null;

  return (
    <Link href={href} onClick={onOpen}>
      <div className="group flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <div
          className="border-b p-4 dark:border-neutral-800"
          style={{
            minHeight: "88px",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em]">
              {billNo}
              {bill?.originChamber || bill?.chamber ? (
                <span className="ml-2 text-[12px] font-normal text-neutral-600 dark:text-neutral-400">
                  {(bill.originChamber || bill.chamber)?.toLowerCase() === "house"
                    ? "House of Representatives"
                    : bill.originChamber || bill.chamber}
                </span>
              ) : null}
            </h3>
          </div>

          {/* Title clamped to 2 lines */}
          <p
            className="text-[14.5px] leading-snug font-medium"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6rem",
            }}
          >
            {bill?.title || bill?.titleWithoutNumber || billNo}
          </p>
        </div>

        <div className="flex grow flex-col p-4">
          {/* Label + date (match list view style) */}
          <div className="mb-1 text-[12px] text-neutral-500 dark:text-neutral-400">
            Latest Action{lastActionDate ? ` • ${formatDate(lastActionDate)}` : ""}
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

          {/* Introduced line */}
          <div className="mt-auto pt-3 text-[12px] text-neutral-600 dark:text-neutral-400">
            Introduced {formatDate(introduced)}
          </div>
        </div>
      </div>
    </Link>
  );
}
