"use client";

import SearchButton from "@/components/search/SearchButton";
import ThemeToggle from "@/components/ThemeToggle"; // adjust path if needed

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <section className="my-2">
          <h1 className="text-[26px] font-semibold tracking-[-0.01em]">
            Capitol Ethics
          </h1>
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            A live feed of House & Senate ethics actions{" "}
          </p>
        </section>{" "}
        <div className="flex items-center gap-2">
          <SearchButton />
          {/* {typeof ThemeToggle === "function" ? <ThemeToggle /> : null} */}
        </div>
      </div>
    </header>
  );
}
