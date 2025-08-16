export default function Spinner({ className = "" }) {
  return (
    <div
      className={`h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent
                  dark:border-neutral-700 ${className}`}
      aria-label="Loading"
    />
  );
}
