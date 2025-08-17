"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cosponsors from "@/components/cosponsors";
import Actions from "@/components/actions";
import Text from "@/components/text";
import Loading from "@/components/ui/Loading";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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

const toTitleCase = (str = "") =>
  String(str).replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );

export default function Bill({ params }) {
  const { congress, billType, billNumber } = params;

  const [oneBill, setOneBill] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestActionText =
    oneBill?.latestAction?.text ?? oneBill?.latestAction ?? "";
  const latestActionDate = oneBill?.latestAction?.actionDate ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
    })();
    return () => {
      cancelled = true;
    };
  }, [congress, billType, billNumber]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
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

  const chamberRaw =
    oneBill?.originChamber ||
    oneBill?.chamber ||
    (/^S/i.test(oneBill?.type ?? billType) ? "Senate" : "House");

  const chamber =
    chamberRaw?.toLowerCase() === "house"
      ? "House of Representatives"
      : chamberRaw;

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
      {/* Back chip */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[13px]
                   text-neutral-700 visited:text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
                   dark:border-neutral-800 dark:text-neutral-300 dark:visited:text-neutral-300 dark:hover:bg-neutral-800
                   transition-colors"
      >
        <span aria-hidden>←</span> Back to latest
      </Link>

      {/* CARD 1 — Main */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
            {billNo}
            <span className="ml-2 text-[13px] font-normal text-neutral-600 dark:text-neutral-400">
              {chamber}
            </span>
          </h1>
        </div>

        {/* Title (clamped to 2; header height stays compact) */}
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

        {/* Meta sections */}
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em]">
              Introduced
            </div>
            <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
              {formatDate(introduced)}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em]">
              Congress
            </div>
            <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
              {congress}
            </div>
          </div>

          {policyAreaName && (
            <div>
              <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em]">
                Policy area
              </div>
              <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
                {policyAreaName}
              </div>
            </div>
          )}

          {latestActionText && (
            <div>
              <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em]">
                Latest action
              </div>
              <p
                className="text-[14px] leading-5"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
                title={latestActionText}
              >
                {latestActionDate ? `${formatDate(latestActionDate)}` : ""}
                : {latestActionText}

              </p>
            </div>
          )}

          {/* Bill text (chip-styled links) */}
          <div>
            <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em]">
              Bill text
            </div>
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
          </div>
          {/* Primary sponsors (chips) */}
          {sponsors.length > 0 && (
            <div>
              <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em]">
                {sponsors.length > 1 ? "Sponsors" : "Sponsor"}
              </div>
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
                      <Link key={`${s?.bioguideId ?? i}-${i}`} href={href}>
                        {content}
                      </Link>
                    ) : (
                      <span key={`${i}-noid`}>{content}</span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Cosponsors (chips). If component outputs 'None' as text, style spans/divs as chips too */}
          <div>
            <div className="mb-1 text-[13px] font-semibold tracking-[-0.01em]">
              Cosponsors
            </div>
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

                  /* Style plain text fallbacks ('None') as chips as well */
                  [&_span]:inline-flex [&_span]:items-center
                  [&_span]:rounded-xl [&_span]:border [&_span]:px-3 [&_span]:py-1.5
                  [&_span]:text-[12px] [&_span]:m-1.5
                  [&_span]:text-neutral-500 dark:[&_span]:text-neutral-400
                  dark:[&_span]:border-neutral-800

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
          </div>
        </div>
      </section>

      {/* CARD 2 — Action history */}
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
