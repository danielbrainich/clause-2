"use client";

import { useEffect, useState } from "react";
import { cleanActionString } from "@/app/utils/utils";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Actions({ congress, billType, billNumber }) {
  const [isLoading, setIsLoading] = useState(true);
  const [actions, setActions] = useState([]); // was "" → make it an array
  const [error, setError] = useState("");

  function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(
          `/api/show-bill/${congress}/${billType}/${billNumber}/actions`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setActions(Array.isArray(data?.actions) ? data.actions : []);
      } catch (e) {
        console.error("failed to fetch actions:", e);
        if (!cancelled) setError("Failed to load actions.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [congress, billType, billNumber]);

  if (isLoading && actions.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">Action history</div>
        <div className="flex items-center gap-3 text-neutral-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent dark:border-neutral-700"
            aria-hidden
          />
          <span className="text-sm">Loading…</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">Action history</div>
        <div className="text-[13px] text-rose-600 dark:text-rose-400">{error}</div>
      </section>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">Action history</div>
        <div className="text-[13px] text-neutral-600 dark:text-neutral-400">No actions found.</div>
      </section>
    );
  }

  return (
    <section className="">

      <ul className="space-y-3">
        {actions.map((action, i) => (
          <li key={i} className="relative pl-6">
            {/* timeline dot */}
            <div className="absolute left-0 top-[0.4rem] h-1 w-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />

            {/* date */}
            <div className="text-[12px] text-neutral-600 dark:text-neutral-400">
              {formatDate(action?.actionDate)}
            </div>

            {/* text (3-line clamp) */}
            <div
              className={`${inter.className} text-[14px] leading-5`}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={cleanActionString(action?.text)}
            >
              {cleanActionString(action?.text)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
