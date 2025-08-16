export default function StageBadge({ stage }) {
  const tones = {
    Law: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Introduced:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    Active:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    default:
      "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
  };
  const tone = tones[stage] || tones.default;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {stage}
    </span>
  );
}
