"use client";

import { useSearch } from "./SearchProvider";

export default function SearchButton({ className = "", label = "Search" }) {
  const { openDialog } = useSearch();

  return (
    <button
      type="button"
      onClick={openDialog}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px]
                  text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
                  dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40
                  ${className}`}
      aria-label="Open search"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 opacity-80">
        <path
          d="m21 21-4.3-4.3M3 11a8 8 0 1 0 16 0A8 8 0 0 0 3 11Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
