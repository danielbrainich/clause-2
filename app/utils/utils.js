export const cleanActionString = (val) => {
  const t = String(val ?? ""); // never crash on undefined/null
  // Strip optional "Latest Action:" label
  const noLabel = t.replace(/^Latest Action:\s*/i, "");
  // Remove a trailing parenthetical like " (text: CR S1600-1601)"
  const noParenTail = noLabel.replace(/\s*\([^)]*\)\s*$/g, "");
  // Collapse whitespace
  return noParenTail.replace(/\s+/g, " ").trim();
};
