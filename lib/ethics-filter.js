// Resolutions often carry discipline/ethics matters, but we’ll allow any type
export function isCongressType(t) {
    const type = String(t || "").toUpperCase();
    return ["HRES", "SRES", "HR", "S", "HJRES", "SJRES"].includes(type);
  }

  // Matches list-level action lines like:
  // "Referred to the House Committee on Ethics."
  // "Referred to the Select Committee on Ethics."
  // Covers the old House name too: "Committee on Standards of Official Conduct".
  export const ETHICS_LATESTACTION_RE =
    /\b(Committee on Ethics|Select Committee on Ethics|Committee on Standards of Official Conduct)\b/i;

  // If you fetch committees for a bill, match their names:
  export const ETHICS_COMMITTEE_NAME_RE =
    /\b(Committee on Ethics|Select Committee on Ethics|Committee on Standards of Official Conduct)\b/i;

  // Quick screen based on LIST data only
  export function quickEthicsFromList(b) {
    if (!b) return false;
    const latest = String(b?.latestAction?.text || "");
    return ETHICS_LATESTACTION_RE.test(latest);
  }

  // Normalize a bill shape for storage/feeds
  export function pickBillFields(b) {
    return {
      congress: b.congress,
      type: b.type,
      number: b.number,
      title: b.title || b.titleWithoutNumber || null,
      originChamber: b.originChamber || b.chamber || null,
      latestAction: b.latestAction || null,
      updateDate: b.updateDate || null,
      url: b.url || null,
      congressdotgov_url: b.url || null,
    };
  }
