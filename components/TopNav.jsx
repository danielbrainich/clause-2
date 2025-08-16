import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function TopNav() {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-white/70
                        dark:supports-[backdrop-filter]:bg-neutral-950/60 dark:border-neutral-800"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Capitol View
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
