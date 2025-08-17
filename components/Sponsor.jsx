import Link from "next/link";

function SponsorChip({ sponsor }) {
  const href = sponsor?.bioguideId ? `/pol/${sponsor.bioguideId}` : null;
  const text = `${sponsor?.district ? "Rep." : "Sen."} ${sponsor?.directOrderName || sponsor?.fullname || sponsor?.lastName || "Member"} [${
    sponsor?.party ?? "?"
  }-${sponsor?.state ?? "?"}${sponsor?.district ? `-${sponsor.district}` : ""}]`;

  const cls =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] " +
    "text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800";

  const stop = (e) => e.stopPropagation();

  return href ? (
    <Link href={href} prefetch={false} className={cls} onClick={stop} onMouseDown={stop}>
      {text}
    </Link>
  ) : (
    <span className={`${cls} opacity-60 cursor-default`} onMouseDown={stop}>
      {text}
    </span>
  );
}
