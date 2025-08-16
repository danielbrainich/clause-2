"use client";

import Spinner from "@/components/ui/Spinner";

export default function Loading({
  label = "Loading…",
  size = "md",        // "sm" | "md" | "lg"
  variant = "block",  // "inline" | "block" | "page"
  className = "",
}) {
  const sizeClass =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  const containerClass =
    variant === "inline"
      ? "inline-flex items-center gap-2 align-middle"
      : variant === "page"
      ? "fixed inset-0 z-50 flex items-center justify-center"
      : "flex items-center gap-2";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`${containerClass} text-neutral-600 dark:text-neutral-400 ${className}`}
    >
      <Spinner className={`${sizeClass} border-neutral-300 dark:border-neutral-700`} />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
