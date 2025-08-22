// components/search/SearchDialog.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearch } from "./SearchProvider";

// Compact spinner
function InlineSpinner({ size = "sm" }) {
  const sizes = {
    xs: "h-3 w-3 border",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
  };
  return (
    <span className="inline-flex items-center" role="status" aria-label="Loading">
      <span
        className={`${sizes[size]} animate-spin rounded-full border-t-transparent border-neutral-300 dark:border-neutral-700`}
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </span>
  );
}

// normalize helper (client-side match)
const normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");

export default function SearchDialog() {
  const { open, closeDialog } = useSearch();

  // ─────────────────────────────────────────────────────────────────────────────
  // MEMBERS-ONLY SEARCH (Bills search has been removed/commented out)
  // ─────────────────────────────────────────────────────────────────────────────
  const [allReps, setAllReps] = useState([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [memLoading, setMemLoading] = useState(false);
  const [memError, setMemError] = useState("");
  const [memResults, setMemResults] = useState([]);

  // Reset dialog state each time it's opened
  useEffect(() => {
    if (!open) return;
    setMemError("");
    setMemResults([]);
    // keep whatever the user typed last time in `q` for convenience
  }, [open]);

  // Load legislators when dialog opens (no tabs anymore)
  useEffect(() => {
    if (!open || membersLoaded) return;
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
  }, [open, membersLoaded]);

  // Submit (client-side filter)
  const submitMembers = (e) => {
    e?.preventDefault?.();
    setMemError("");
    const needle = normalize(q);
    if (!needle) {
      setMemResults([]);
      return;
    }
    const results = allReps.filter((o) => normalize(o?.name).includes(needle));
    setMemResults(results);
  };

  // Optional: live filter as they type (uncomment if you want instant results)
  // useEffect(() => {
  //   if (!membersLoaded) return;
  //   const needle = normalize(q);
  //   setMemResults(needle ? allReps.filter((o) => normalize(o?.name).includes(needle)) : []);
  // }, [q, membersLoaded, allReps]);

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
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 opacity-70">
              <path
                d="m21 21-4.3-4.3M3 11a8 8 0 1 0 16 0A8 8 0 0 0 3 11Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-[14.5px] font-medium">Search legislators</div>
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

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-3">
          <div className="grid gap-3">
            {/* Form */}
            <form onSubmit={submitMembers} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-medium
                             text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
                             dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={memLoading}
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
              <div className="text-[12px] text-rose-600 dark:text-rose-400">{memError}</div>
            )}

            {/* Results */}
            {memResults.length > 0 ? (
              <ul className="grid gap-2">
                {memResults.slice(0, 20).map((m, i) => (
                  <li key={`${m?.bioguideId ?? i}-${i}`}>
                    <Link
                      href={`/pol/${m?.bioguideId ?? ""}`}
                      onClick={closeDialog}
                      className="flex items-center justify-between rounded-2xl border p-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                    >
                      <div className="truncate">
                        <div className="text-[15px] font-medium truncate">{m?.name || "—"}</div>
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
              <div className="text-[13px] text-neutral-600 dark:text-neutral-400">No matches.</div>
            ) : null}
          </div>
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

/* ---------------------------------------------------------------------------
   NOTE: Bill search code has been intentionally removed for a members-only UI.
   To restore it, bring back:
     - BILL_TYPES array, bill form state, submitBill()
     - the "Bills" JSX form and result card
     - optionally tabs to switch between Bills / Legislators
--------------------------------------------------------------------------- */
