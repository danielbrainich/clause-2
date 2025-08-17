// app/pol/[bioguideId]/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// tiny neutral spinner
function InlineSpinner({ size = "sm" }) {
  const sizes = { xs: "h-3 w-3 border", sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2" };
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

const toTitleCase = (s = "") =>
  String(s).replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function cleanActionString(str = "") {
  // keep your util if you want; this is a safe inline fallback
  return String(str).replace(/\s+/g, " ").trim();
}

// Shared bill card (matches home look)
function BillCard({ bill }) {
  const billNo = `${bill?.type ?? "?"}-${bill?.number ?? "?"}`;
  const href = `/bill/${bill?.congress}/${bill?.type}/${bill?.number}`;
  const introduced =
    bill?.introducedDate || bill?.introDate || bill?.latestAction?.actionDate || null;
  const latest = cleanActionString(bill?.latestAction?.text || bill?.latestAction || "");

  return (
    <Link href={href} prefetch={false}>
      <div className="group flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <div
          className="border-b p-4 dark:border-neutral-800"
          style={{ minHeight: 88, display: "flex", flexDirection: "column", gap: "0.4rem" }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em]">{billNo}</h3>
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
          <p
            className="text-[13px] leading-5"
            title={latest}
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
}

export default function RepresentativePage({ params }) {
  const bioguideId = decodeURIComponent(params?.bioguideId || "");

  const [rep, setRep] = useState(null);
  const [sponsored, setSponsored] = useState([]);
  const [cosponsored, setCosponsored] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Member
        const r1 = await fetch(`/api/show-rep/${encodeURIComponent(bioguideId)}`, { cache: "no-store" });
        if (!r1.ok) throw new Error(`Member HTTP ${r1.status}`);
        const j1 = await r1.json();
        const member = j1?.member ?? j1 ?? null; // handle either shape
        if (cancelled) return;
        setRep(member);

        // Sponsored
        const r2 = await fetch(`/api/rep/sponsored-legislation/${encodeURIComponent(bioguideId)}`, { cache: "no-store" });
        if (r2.ok) {
          const j2 = await r2.json();
          if (!cancelled) setSponsored(Array.isArray(j2?.sponsoredLegislation) ? j2.sponsoredLegislation : []);
        }

        // Cosponsored
        const r3 = await fetch(`/api/rep/cosponsored-legislation/${encodeURIComponent(bioguideId)}`, { cache: "no-store" });
        if (r3.ok) {
          const j3 = await r3.json();
          if (!cancelled) setCosponsored(Array.isArray(j3?.cosponsoredLegislation) ? j3.cosponsoredLegislation : []);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bioguideId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
          <InlineSpinner size="md" />
          <span className="text-sm">Loading…</span>
        </div>
      </main>
    );
  }

  if (err || !rep) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border p-4 text-sm text-rose-600 dark:border-neutral-800 dark:text-rose-400">
          {err || "No member found."}
        </div>
      </main>
    );
  }

  const title = rep?.district ? "Rep." : "Sen.";
  const name = rep?.directOrderName || rep?.name || "";
  const portrait = rep?.depiction?.imageUrl || null;
  const party = rep?.partyHistory?.[0]?.partyName || null;
  const state = rep?.state || null;
  const district = rep?.district || null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Back chip */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[12.5px]
                   text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50
                   dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <span aria-hidden>←</span> Back to latest
      </Link>

      {/* Summary card */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start gap-4">
          {portrait ? (
            <img
              src={portrait}
              alt={`Photo of ${name || "Member"}`}
              className="h-24 w-24 rounded-xl object-cover border dark:border-neutral-800"
            />
          ) : null}

          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
              {title} {name || "—"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-xl border px-2.5 py-1 text-[12px] dark:border-neutral-800">
                {rep?.district ? "Representative" : "Senator"}
              </span>
              {party ? (
                <span className="rounded-xl border px-2.5 py-1 text-[12px] dark:border-neutral-800">
                  {party}
                </span>
              ) : null}
              {(state || district) && (
                <span className="rounded-xl border px-2.5 py-1 text-[12px] dark:border-neutral-800">
                  {state}{district ? `-${district}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsored */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">Sponsored legislation</div>
        {sponsored.filter((b) => b?.title).length > 0 ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {sponsored
              .filter((b) => b?.title)
              .slice(0, 12)
              .map((bill, i) => (
                <BillCard key={`${bill?.congress}-${bill?.type}-${bill?.number}-${i}`} bill={bill} />
              ))}
          </div>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">No sponsored bills listed.</div>
        )}
      </section>

      {/* Cosponsored */}
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-[13px] font-semibold tracking-[-0.01em]">Cosponsored legislation</div>
        {cosponsored.filter((b) => b?.title).length > 0 ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {cosponsored
              .filter((b) => b?.title)
              .slice(0, 12)
              .map((bill, i) => (
                <BillCard key={`co-${bill?.congress}-${bill?.type}-${bill?.number}-${i}`} bill={bill} />
              ))}
          </div>
        ) : (
          <div className="text-[13px] text-neutral-600 dark:text-neutral-400">No cosponsored bills listed.</div>
        )}
      </section>
    </main>
  );
}
