"use client";
import Link from "next/link";
import SearchButton from "@/components/search/SearchButton";
import ThemeToggle from "@/components/ThemeToggle"; // if you have it

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.01em]">Capitol View</Link>
        <div className="flex items-center gap-2">
          <SearchButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
