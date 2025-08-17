// Discipline keywords
export const DISCIPLINE_RE =
  /\b(censur(?:e|ed|es|ing)|reprimand(?:ed|s|ing)?|expel(?:led|s|ling)?|expulsion|condemn(?:ed|s|ing)?|condemnation)\b/i;

// Looks like it targets a specific Member of Congress (name + title)
const NAME_TITLED_RE =
  /\b(?:Rep\.|Representative|Sen\.|Senator|Del\.|Delegate|Resident Commissioner)\s+[A-Z][A-Za-z.'-]{1,}(?:\s+[A-Z][A-Za-z.'-]{1,})*/i;

// Explicit phrasing that it’s about a Member of Congress
const EXPLICIT_MEMBER_RE =
  /\b(?:Member|Delegate|Resident Commissioner) of (?:the )?(?:House of Representatives|Senate|Congress)\b/i;

// Common false positives like “members of the U.N./Security Council”
const NON_CONGRESS_MEMBERS_RE =
  /\bmembers?\s+of\s+the\s+(?:united nations|u\.n\.?|security council|cabinet|eu|nato)\b/i;

export function isResolution(type) {
  const t = String(type || "").toUpperCase();
  return t === "HRES" || t === "SRES";
}

// Fast, list-only classifier
export function quickDisciplineFromList(b, { strict = true } = {}) {
  if (!isResolution(b?.type)) return false;

  const title  = String(b?.title || "");
  const latest = String(b?.latestAction?.text || "");
  const text   = `${title} ${latest}`;

  // Must look like discipline
  if (!DISCIPLINE_RE.test(text)) return false;

  // Loose mode: accept all discipline-looking resolutions
  if (!strict) return true;

  // Strict mode: must clearly target a Member of Congress
  if (NAME_TITLED_RE.test(title) || NAME_TITLED_RE.test(latest)) return true;
  if (EXPLICIT_MEMBER_RE.test(text)) return true;

  // Guard against non-Congress “members” contexts (optional)
  if (typeof NON_CONGRESS_MEMBERS_RE !== "undefined" && NON_CONGRESS_MEMBERS_RE.test(text)) return false;

  return false;
}
