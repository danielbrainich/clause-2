// app/pol/[bioguideId]/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cleanActionString } from "@/app/utils/utils";
import { Inter } from "next/font/google";

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
const toTitleCase = (str = "") =>
  String(str).replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );

export default function Representative({ params }) {
  const { bioguideId } = params;

  const [rep, setRep] = useState(null);
  const [repName, setRepName] = useState("");
  const [sponsoredLeg, setSponsoredLeg] = useState([]);
  const [cosponsoredLeg, setCosponsoredLeg] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Fetch member
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setErr(null);
        const response = await fetch(`/api/show-rep/${bioguideId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        const member = data?.member ?? null;
        setRep(member);
        const title = member?.district ? "Rep." : "Sen.";
        const name = member?.directOrderName ?? "";
        setRepName(`${title} ${name}`.trim());
      } catch (e) {
        if (!cancelled) setErr("Failed to load member.");
        console.error("error fetching member:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  // Fetch sponsored
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/rep/sponsored-legislation/${bioguideId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled)
          setSponsoredLeg(
            Array.isArray(data?.sponsoredLegislation)
              ? data.sponsoredLegislation
              : []
          );
      } catch (e) {
        console.error("error fetching sponsored:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  // Fetch cosponsored
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/rep/cosponsored-legislation/${bioguideId}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled)
          setCosponsoredLeg(
            Array.isArray(data?.cosponsoredLegislation)
              ? data.cosponsoredLegislation
              : []
          );
      } catch (e) {
        console.error("error fetching cosponsored:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex justify-center items-center gap-2 text-blue-600 dark:text-blue-400">
          <InlineSpinner size="sm" />
          <span className="text-sm">Loading…</span>
        </div>
      </main>
    );
  }

  if (err || !rep) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border p-4 text-sm text-rose-600 dark:border-neutral-800 dark:text-rose-400">
          {err || "Could not load member data."}
        </div>
      </main>
    );
  }

  const party = rep?.partyHistory?.[0]?.partyName ?? null;
  const state = rep?.state ?? null;
  const district = rep?.district ?? null;
  const portrait = rep?.depiction?.imageUrl ?? null;
  const roleChip = district ? "Representative" : "Senator";

  // bill card (shared look with home)
  const BillCard = ({ bill }) => {
    const billNo = `${bill?.type ?? "?"}-${bill?.number ?? "?"}`;
    const href = `/bill/${bill?.congress}/${bill?.type}/${bill?.number}`;
    const introduced =
      bill?.introducedDate ||
      bill?.introDate ||
      bill?.latestAction?.actionDate ||
      null;
    const latest = cleanActionString(
      bill?.latestAction?.text || bill?.latestAction || ""
    );

    return (
      <Link href={href}>
        <div className="group flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          {/* Header: bill number + (optional) chamber if present */}
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
                    {bill.originChamber || bill.chamber}
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
              {bill?.title || billNo}
            </p>
          </div>

          {/* Body: latest action (3-line clamp) + footer date */}
          <div className="flex grow flex-col p-4">
            <p
              className="text-[13px] leading-5"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "3.75rem",
              }}
            >
              {latest || "—"}
            </p>
            <div className="mt-auto pt-3 text-[12px] text-neutral-600 dark:text-neutral-400">
              Introduced {formatDate(introduced)}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <main className={`${inter.className} mx-auto max-w-5xl px-4 py-6`}>
      {/* Back chip */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[13px]
                   text-blue-700 hover:text-blue-900 hover:bg-neutral-50
                   dark:border-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-800"
      >
        <span aria-hidden>←</span> Back to latest
      </Link>

      {/* Summary card */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
            {repName || "—"}
          </h1>
        </div>

        <div className="mt-3 flex items-start gap-4">
          {portrait ? (
            <img
              src={portrait}
              alt={`Photo of ${rep?.directOrderName ?? "Member"}`}
              className="h-24 w-24 rounded-xl object-cover border dark:border-neutral-800"
            />
          ) : null}

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border px-2.5 py-1 text-[12px] dark:border-neutral-800">
                {roleChip}
              </span>
              {party ? (
                <span className="rounded-xl border px-2.5 py-1 text-[12px] dark:border-neutral-800">
                  {party}
                </span>
              ) : null}
              {state || district ? (
                <span className="rounded-xl border px-2.5 py-1 text-[12px] dark:border-neutral-800">
                  {state}
                  {district ? `-${district}` : ""}
                </span>
              ) : null}
            </div>

            {/* Plain text lines */}
            <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
              {party ? `${party} Party` : "—"}
            </div>
            <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
              {state || "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsored legislation */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Sponsored legislation
        </div>
        {Array.isArray(sponsoredLeg) &&
        sponsoredLeg.filter((b) => b?.title).length > 0 ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {sponsoredLeg
              .filter((b) => b?.title)
              .slice(0, 12)
              .map((bill, i) => (
                <BillCard
                  key={`${bill?.congress}-${bill?.type}-${bill?.number}-${i}`}
                  bill={bill}
                />
              ))}
          </div>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
            No sponsored bills listed.
          </div>
        )}
      </section>

      {/* Cosponsored legislation */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Cosponsored legislation
        </div>
        {Array.isArray(cosponsoredLeg) &&
        cosponsoredLeg.filter((b) => b?.title).length > 0 ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {cosponsoredLeg
              .filter((b) => b?.title)
              .slice(0, 12)
              .map((bill, i) => (
                <BillCard
                  key={`co-${bill?.congress}-${bill?.type}-${bill?.number}-${i}`}
                  bill={bill}
                />
              ))}
          </div>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
            No cosponsored bills listed.
          </div>
        )}
      </section>
    </main>
  );
}
