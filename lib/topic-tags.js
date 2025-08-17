// lib/topic-tags.js

function toArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (typeof x === "string") return [x];
  if (x && typeof x === "object") {
    if (Array.isArray(x.items)) return x.items;
    if (Array.isArray(x.legislativeSubjects)) return x.legislativeSubjects;
    if (Array.isArray(x.legislativeSubject)) return x.legislativeSubject;
    if (Array.isArray(x.committees)) return x.committees;
    if (Array.isArray(x.committee)) return x.committee;
  }
  return [];
}

function hasMemberWord(s = "") {
  return /\b(representative|rep\.|senator|sen\.|member)\b/i.test(s);
}

export function topicTags(bill = {}, { strict = false } = {}) {
  const tags = new Set();

  const type = String(bill?.type || "").toUpperCase();
  const title = (bill?.title || bill?.titleWithoutNumber || "").toLowerCase();
  const latest = (bill?.latestAction?.text || "").toLowerCase();
  const text = `${title} ${latest}`;

  const subjectsRaw = toArray(bill?.subjects?.legislativeSubjects).length
    ? toArray(bill?.subjects?.legislativeSubjects)
    : toArray(bill?.subjects);

  const subjects = subjectsRaw
    .map((s) => (s?.name || s || "").toString().toLowerCase())
    .filter(Boolean);

  const committeesList = [
    ...toArray(bill?.committees),
    ...toArray(bill?.committeeReports),
    ...toArray(bill?.actions),
  ];

  const committeesBlob = committeesList
    .map((c) => (c?.name || c?.text || "").toLowerCase())
    .filter(Boolean)
    .join(" ");

  const isResolution = type === "HRES" || type === "SRES";
  const hitCensure = /\bcensur(e|ed|ing)\b/.test(text);
  const hitReprimand = /\breprimand(ed|ing)?\b/.test(text);
  const hitExpel = /\bexpel(l|led|ling)?\b/.test(text);
  const hitCondemnMbr =
    /\bcondemn(ing|s|ed)?\b/.test(text) && hasMemberWord(text);
  const ethicsSubject = subjects.some((s) =>
    /(congressional ethics|ethics investigations|misconduct)/.test(s)
  );
  const ethicsCommittee =
    /(committee on ethics|select committee on ethics)/.test(committeesBlob);

  if (strict) {
    const ok =
      isResolution &&
      (hitCensure ||
        hitReprimand ||
        hitExpel ||
        hitCondemnMbr ||
        (ethicsSubject && hasMemberWord(text)) ||
        (ethicsCommittee && hasMemberWord(text)));
    if (ok) tags.add("discipline");
    return Array.from(tags);
  }

  if (
    isResolution &&
    (hitCensure ||
      hitReprimand ||
      hitExpel ||
      hitCondemnMbr ||
      ethicsSubject ||
      ethicsCommittee)
  ) {
    tags.add("discipline");
  }
  return Array.from(tags);
}
