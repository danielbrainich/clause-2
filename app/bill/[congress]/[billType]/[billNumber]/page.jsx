"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cosponsors from "@/components/cosponsors";
import Actions from "@/components/actions";
import Text from "@/components/text";
import { Inter } from "next/font/google";
import Loading from "@/components/ui/Loading";

const inter = Inter({ subsets: ["latin"] });

// tiny CSS spinner (no SVG issues)
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

export default function Bill({ params }) {
  const { congress, billType, billNumber } = params;

  const [oneBill, setOneBill] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const toTitleCase = (str = "") =>
    String(str).replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );

  useEffect(() => {
    let cancelled = false;
    const fetchOneBill = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(
          `/api/show-bill/${congress}/${billType}/${billNumber}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setOneBill(data?.bill ?? null);
      } catch (e) {
        if (!cancelled) setError("Failed to load bill.");
        console.error("failed to fetch one bill:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchOneBill();
    return () => {
      cancelled = true;
    };
  }, [congress, billType, billNumber]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Loading variant="block" size="lg" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border p-4 text-sm text-rose-600 dark:border-neutral-800 dark:text-rose-400">
          {error}
        </div>
      </main>
    );
  }

  if (!oneBill) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border p-4 text-sm dark:border-neutral-800">
          Could not load bill data.
        </div>
      </main>
    );
  }

  const sponsors = Array.isArray(oneBill?.sponsors) ? oneBill.sponsors : [];
  const policyAreaName = oneBill?.policyArea?.name ?? null;
  const billNo = `${oneBill?.type ?? billType}-${
    oneBill?.number ?? billNumber
  }`;
  const latestAction =
    oneBill?.latestAction?.text ?? oneBill?.latestAction ?? "";

  const introduced =
    oneBill?.introducedDate ??
    oneBill?.introduced ??
    oneBill?.introDate ??
    oneBill?.latestAction?.actionDate ??
    null;

  return (
    <main className={`${inter.className} mx-auto max-w-4xl px-4 py-6`}>
      {/* Back chip — matches home chip style */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[13px]
             text-neutral-700 visited:text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
             dark:border-neutral-800 dark:text-neutral-300 dark:visited:text-neutral-300 dark:hover:bg-neutral-800
             transition-colors"
      >
        <span aria-hidden>←</span> Back to latest
      </Link>

      {/* Summary card */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
            {billNo}
            {oneBill?.originChamber || oneBill?.chamber ? (
              <span className="ml-2 text-[13px] font-normal text-neutral-600 dark:text-neutral-400">
                {oneBill.originChamber || oneBill.chamber}
              </span>
            ) : null}
          </h1>
        </div>

        {/* Bill title — clamp to 2 lines (uniform height) */}
        <p
          className="mt-1 text-[16px] leading-snug font-medium"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.6rem",
          }}
        >
          {oneBill?.title || oneBill?.titleWithoutNumber || billNo}
        </p>

        {/* Meta */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-neutral-600 dark:text-neutral-400">
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              Introduced:
            </span>{" "}
            {formatDate(introduced)}
          </div>
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              Congress:
            </span>{" "}
            {congress}
          </div>
          {policyAreaName ? (
            <div className="col-span-2">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Policy area:
              </span>{" "}
              {policyAreaName}
            </div>
          ) : null}
        </div>

        {/* Latest action — clamp to 3 lines to match home density */}
        {latestAction ? (
          <>
            <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
              Latest action
            </div>
            <p
              className="text-[14px] leading-5"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "3.75rem", // 3 * 1.25rem
              }}
            >
              {latestAction}
            </p>
          </>
        ) : null}

        {/* Link chips — unified styling */}
        <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
          {oneBill?.congressdotgov_url && (
            <a
              href={oneBill.congressdotgov_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border px-3 py-1.5 hover:bg-neutral-50
                         text-blue-700 hover:text-blue-900
                         dark:border-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-800"
            >
              View on Congress.gov
            </a>
          )}
        </div>

        {/* Sponsors list */}
        {sponsors.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
              {sponsors.length > 1 ? "Sponsors" : "Sponsor"}
            </div>
            <div className="mt-1 space-y-1">
              {sponsors.map((s, i) => {
                const label = s?.district ? "Rep." : "Sen.";
                const full = s?.fullname
                  ? toTitleCase(s.fullname)
                  : s?.lastName
                  ? toTitleCase(s.lastName)
                  : "";
                const suffix = `[${s?.party ?? "?"}-${s?.state ?? "?"}${
                  s?.district ? `-${s.district}` : ""
                }]`;
                const href = s?.bioguideId ? `/pol/${s.bioguideId}` : null;

                const content = (
                  <>
                    <span className="font-medium">{label}</span>{" "}
                    <span>{full}</span>{" "}
                    <span className="text-neutral-500">{suffix}</span>
                  </>
                );

                return href ? (
                  <Link
                    key={`${s?.bioguideId ?? i}-${i}`}
                    href={href}
                    className="inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[12px]
                    text-neutral-700 visited:text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
                    dark:border-neutral-800 dark:text-neutral-300 dark:visited:text-neutral-300 dark:hover:bg-neutral-800
                    transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    key={`${i}-noid`}
                    className="inline-flex items-center text-[13px] text-neutral-600 dark:text-neutral-400"
                  >
                    {content}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Bill text */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Bill text
        </div>

        {/* Chip-styled links inside <Text /> */}
        <div className="mt-1 -m-1.5">
          <div
            className="
        [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1
        [&_a]:rounded-xl [&_a]:border [&_a]:px-3 [&_a]:py-1.5
        [&_a]:text-[12px] [&_a]:transition-colors
        [&_a]:text-neutral-700 [&_a:visited]:text-neutral-700
        [&_a:hover]:text-neutral-900 [&_a:hover]:bg-neutral-50
        dark:[&_a]:text-neutral-300 dark:[&_a:visited]:text-neutral-300
        dark:[&_a]:border-neutral-800 dark:[&_a:hover]:bg-neutral-800
        [&_a:focus-visible]:outline-none
        [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-neutral-400/40
        [&_a]:m-1.5
        [&_ul]:list-none [&_ol]:list-none [&_li]:m-0
      "
          >
            <Text
              congress={congress}
              billType={billType}
              billNumber={billNumber}
            />
          </div>
        </div>
      </section>

      {/* Cosponsors */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Cosponsors
        </div>

        {/* Chip-styled links inside <Cosponsors /> */}
        <div className="mt-1 -m-1.5">
          <div
            className="
        [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1
        [&_a]:rounded-xl [&_a]:border [&_a]:px-3 [&_a]:py-1.5
        [&_a]:text-[12px] [&_a]:transition-colors
        [&_a]:text-neutral-700 [&_a:visited]:text-neutral-700
        [&_a:hover]:text-neutral-900 [&_a:hover]:bg-neutral-50
        dark:[&_a]:text-neutral-300 dark:[&_a:visited]:text-neutral-300
        dark:[&_a]:border-neutral-800 dark:[&_a:hover]:bg-neutral-800
        [&_a:focus-visible]:outline-none
        [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-neutral-400/40
        [&_a]:m-1.5
        [&_ul]:list-none [&_ol]:list-none [&_li]:m-0
      "
          >
            <Cosponsors
              congress={congress}
              billType={billType}
              billNumber={billNumber}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Action history
        </div>
        <Actions
          congress={congress}
          billType={billType}
          billNumber={billNumber}
        />
      </section>
    </main>
  );
}
