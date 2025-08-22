"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { cleanActionString as clean } from "@/app/utils/utils";

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

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
  >
    {children}
  </div>
);
const Grid = ({ children }) => (
  <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
    {children}
  </div>
);

function BillCard({ bill }) {
  const billNo = `${bill?.type ?? "?"}-${bill?.number ?? "?"}`;
  const href = `/bill/${bill?.congress}/${bill?.type}/${bill?.number}`;
  const chamberRaw = bill?.originChamber || bill?.chamber || "—";
  const chamber =
    chamberRaw === "House" ? "House of Representatives" : chamberRaw;
  const introduced =
    bill?.introducedDate ||
    bill?.introDate ||
    bill?.latestAction?.actionDate ||
    null;
  const latestText = clean(
    typeof bill?.latestAction === "string"
      ? bill.latestAction
      : bill?.latestAction?.text || ""
  );
  const latestDate =
    typeof bill?.latestAction === "object"
      ? bill?.latestAction?.actionDate
      : null;

  return (
    <Link href={href}>
      <div className="group flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <div
          className="border-b p-4 dark:border-neutral-800"
          style={{
            minHeight: 88,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em]">
              {billNo}
              <span className="ml-2 text-[12px] font-normal text-neutral-600 dark:text-neutral-400">
                {chamber}
              </span>
            </h3>
          </div>
          <p
            className="text-[14.5px] leading-snug font-medium"
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
        </div>
        <div className="flex grow flex-col p-4">
          {/* Latest action label + date (matches list style) */}
          <div className="mb-1 text-[12px] text-neutral-500 dark:text-neutral-400">
            Latest Action{latestDate ? ` • ${formatDate(latestDate)}` : ""}
          </div>
          <p
            className="text-[13px] leading-5"
            title={latestText}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "3.75rem",
            }}
          >
            {latestText || "—"}
          </p>
          <div className="mt-auto pt-3 text-[12px] text-neutral-600 dark:text-neutral-400">
            Introduced {formatDate(introduced)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Representative({ params }) {
  const { bioguideId } = params;

  // member basics
  const [rep, setRep] = useState(null);
  const [repName, setRepName] = useState("");
  const [loadingRep, setLoadingRep] = useState(true);
  const [errRep, setErrRep] = useState(null);

  // normal sponsored/cosponsored (existing)
  const [sponsoredLeg, setSponsoredLeg] = useState([]);
  const [cosponsoredLeg, setCosponsoredLeg] = useState([]);

  // ethics-by-member
  const [ethLoading, setEthLoading] = useState(true);
  const [ethErr, setEthErr] = useState(null);
  const [ethAuthored, setEthAuthored] = useState([]);
  const [ethCosponsored, setEthCosponsored] = useState([]);
  const [ethTargeted, setEthTargeted] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingRep(true);
        const r = await fetch(`/api/show-rep/${bioguideId}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancelled) return;
        const member = data?.member ?? null;
        setRep(member);
        const title = member?.district ? "Rep." : "Sen.";
        const name = member?.directOrderName ?? "";
        setRepName(`${title} ${name}`.trim());
      } catch (e) {
        if (!cancelled) setErrRep("Failed to load member.");
      } finally {
        if (!cancelled) setLoadingRep(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  // existing sponsored
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/rep/sponsored-legislation/${bioguideId}`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!cancelled)
          setSponsoredLeg(
            Array.isArray(d?.sponsoredLegislation) ? d.sponsoredLegislation : []
          );
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  // existing cosponsored
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/rep/cosponsored-legislation/${bioguideId}`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!cancelled)
          setCosponsoredLeg(
            Array.isArray(d?.cosponsoredLegislation)
              ? d.cosponsoredLegislation
              : []
          );
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  // ethics by member (NEW) — uses your local ethics store
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setEthLoading(true);
        setEthErr(null);
        const r = await fetch(
          `/api/ethics/by-member/${bioguideId}?limit=24&loose=1`,
          { cache: "no-store" }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (cancelled) return;
        setEthAuthored(d?.authored ?? []);
        setEthCosponsored(d?.cosponsored ?? []);
        setEthTargeted(d?.targeted ?? []);
      } catch (e) {
        if (!cancelled) setEthErr("Failed to load ethics activity.");
      } finally {
        if (!cancelled) setEthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  if (loadingRep) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex justify-center items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <InlineSpinner size="md" />
          <span className="text-sm">Loading…</span>
        </div>
      </main>
    );
  }
  if (errRep || !rep) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border p-4 text-sm text-rose-600 dark:border-neutral-800 dark:text-rose-400">
          {errRep || "Could not load member data."}
        </div>
      </main>
    );
  }

  const party = rep?.partyHistory?.[0]?.partyName ?? null;
  const state = rep?.state ?? null;
  const district = rep?.district ?? null;
  const portrait = rep?.depiction?.imageUrl ?? null;

  return (
    <main className={`${inter.className} mx-auto max-w-5xl px-4 py-6`}>
      {/* Back chip */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[13px]
                   text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
                   dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
      >
        <span aria-hidden>←</span> Back to latest
      </Link>

      {/* Summary card (existing look) */}
      <Card className="mb-6">
        <div className="flex items-start gap-4">
          {portrait ? (
            <img
              src={portrait}
              alt={`Photo of ${rep?.directOrderName ?? "Member"}`}
              className="h-24 w-24 rounded-xl object-cover border dark:border-neutral-800"
            />
          ) : null}
          <div>
            <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
              {repName || "—"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-xl border px-2.5 py-1 text-[12px] dark:border-neutral-800">
                {district ? "Representative" : "Senator"}
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
          </div>
        </div>
      </Card>

      {/* NEW: Ethics measures authored/co-sponsored */}
      <Card className="mb-6">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Ethics actions by this member
        </div>
        {ethLoading ? (
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <InlineSpinner />
            <span className="text-sm">Loading…</span>
          </div>
        ) : ethErr ? (
          <div className="text-[13px] text-rose-600 dark:text-rose-400">
            {ethErr}
          </div>
        ) : ethAuthored.length + ethCosponsored.length > 0 ? (
          <Grid>
            {[...ethAuthored, ...ethCosponsored].slice(0, 12).map((b, i) => (
              <BillCard
                key={`me-${b.congress}-${b.type}-${b.number}-${i}`}
                bill={b}
              />
            ))}
          </Grid>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
            None.
          </div>
        )}
      </Card>

      {/* NEW: Ethics actions naming this member */}
      <Card className="mb-6">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Ethics actions naming this member
        </div>
        {ethLoading ? (
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <InlineSpinner />
            <span className="text-sm">Loading…</span>
          </div>
        ) : ethErr ? (
          <div className="text-[13px] text-rose-600 dark:text-rose-400">
            {ethErr}
          </div>
        ) : ethTargeted.length > 0 ? (
          <Grid>
            {ethTargeted.slice(0, 12).map((b, i) => (
              <BillCard
                key={`tgt-${b.congress}-${b.type}-${b.number}-${i}`}
                bill={b}
              />
            ))}
          </Grid>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
            None.
          </div>
        )}
      </Card>

      {/* Existing: Sponsored */}
      <Card className="mb-6">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Sponsored legislation
        </div>
        {Array.isArray(sponsoredLeg) &&
        sponsoredLeg.filter((b) => b?.title).length > 0 ? (
          <Grid>
            {sponsoredLeg
              .filter((b) => b?.title)
              .slice(0, 12)
              .map((bill, i) => (
                <BillCard
                  key={`spr-${bill?.congress}-${bill?.type}-${bill?.number}-${i}`}
                  bill={bill}
                />
              ))}
          </Grid>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
            None.
          </div>
        )}
      </Card>

      {/* Existing: Cosponsored */}
      <Card>
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">
          Cosponsored legislation
        </div>
        {Array.isArray(cosponsoredLeg) &&
        cosponsoredLeg.filter((b) => b?.title).length > 0 ? (
          <Grid>
            {cosponsoredLeg
              .filter((b) => b?.title)
              .slice(0, 12)
              .map((bill, i) => (
                <BillCard
                  key={`co-${bill?.congress}-${bill?.type}-${bill?.number}-${i}`}
                  bill={bill}
                />
              ))}
          </Grid>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
            None.
          </div>
        )}
      </Card>
    </main>
  );
}
