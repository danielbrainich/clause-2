"use client";

import SearchButton from "@/components/search/SearchButton";
import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import Link from "next/link";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <section className="my-2">
          <Link
            href="/"
            aria-label="Clause 2 — Home"
            className="inline-flex items-center"
          >
            <Image
              src="/clause-2-small.png"
              alt="Clause 2"
              width={160} // tweak as needed
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>
        </section>
        <div className="flex items-center gap-2">
          <SearchButton />
          {/* {typeof ThemeToggle === "function" ? <ThemeToggle /> : null} */}
        </div>
      </div>
    </header>
  );
}
