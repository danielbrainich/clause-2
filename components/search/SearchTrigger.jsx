"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Load dialog lazily so it doesn't bloat initial JS
const SearchDialog = dynamic(() => import("./SearchDialog"), { ssr: false });

export default function SearchTrigger() {
  const [openCount, setOpenCount] = useState(0);
  // bump key to remount dialog when user clicks (not required, but ensures fresh state)
  return (
    <>
      <button
        onClick={() => setOpenCount((n) => n + 1)}
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px]
                   text-blue-700 hover:text-blue-900 hover:bg-neutral-50
                   dark:border-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-800"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
          <path d="m21 21-4.3-4.3M3 11a8 8 0 1 0 16 0A8 8 0 0 0 3 11Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Search</span>
        <span className="ml-1 hidden items-center gap-1 text-[11px] text-neutral-500 sm:flex">
          <kbd className="rounded border px-1 py-0.5 dark:border-neutral-700">⌘</kbd>
          <kbd className="rounded border px-1 py-0.5 dark:border-neutral-700">K</kbd>
        </span>
      </button>
      {/* The dialog is self-contained and also opens via ⌘K/Ctrl-K */}
      <SearchDialog key={openCount} />
    </>
  );
}
