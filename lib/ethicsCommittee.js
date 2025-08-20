export const ETHICS_COMMITTEES = [
  // House Ethics (historically "Standards of Official Conduct")
  { chamber: "house", code: "hsso00" },
  // Senate Select Committee on Ethics
  { chamber: "senate", code: "slet00" },
];

export function billKey({ congress, type, number }) {
  return `${congress}:${String(type).toUpperCase()}:${number}`;
}
