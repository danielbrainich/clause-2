// components/HeroCard.jsx
"use client";

import Image from "next/image";

export default function HeroCard({
  className = "",
  src = "/clause-2-logo.png",
}) {
  return (
    <section
      className={`mb-6 rounded-2xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <div className="grid items-center gap-6 p-5 sm:p-6 lg:grid-cols-3 lg:p-8">
        {/* Image (1/3 on lg+, centered, fixed height so it doesn't grow) */}
        <div className="lg:col-span-1">
          <figure className="mx-auto">
            <div className="relative mx-auto h-56 w-full sm:h-72 lg:h-[18rem] xl:h-[20rem]">
              <Image
                src={src}
                alt="Clause 2 logo"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
            <figcaption className="mt-2 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
              Pictured: Disgraced U.S. Representative{" "}
              <a
                href="https://thehill.com/homenews/house/4338365-george-santoss-historic-rise-fall/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 underline decoration-neutral-400/60 underline-offset-[2px] hover:decoration-neutral-700 dark:text-neutral-300 dark:visited:text-neutral-300 dark:decoration-neutral-500 dark:hover:decoration-neutral-300"
              >
                George Santos
              </a>
            </figcaption>
          </figure>
        </div>

        {/* Text (2/3 on lg+) */}
        <div className="lg:col-span-2">
          <div className="justify-self-center">
            <p className="sm:block text-[13px] md:text-[15px] font-semibold tracking-[-0.01em] text-neutral-700 dark:text-neutral-200">
              Clause 2 - A live feed of House and Senate ethics actions
            </p>
          </div>
          <p className="mt-2 text-[13.5px] leading-6 text-neutral-700 dark:text-neutral-300">
            <span className="whitespace-nowrap">
              Article I, Section 5, Clause 2
            </span>{" "}
            of the U.S. Constitution establishes each chamber’s power to set its
            rules and discipline its members. It provides the constitutional
            basis for the House Committee on Ethics and the Senate Select
            Committee on Ethics.
          </p>
          <p className="mt-2 text-[13.5px] leading-6 text-neutral-700 dark:text-neutral-300">
            This app provides a live feed of the activities of those two
            committees. It includes expulsions, censures, reprimands, rule
            changes, and more. Click any item in the feed for bill details and
            full text. Search for any Senator or Representative to see if
            they’ve sponsored or faced a censure of their own.
          </p>
          <p className="mt-2 text-[13.5px] leading-6 text-neutral-700 dark:text-neutral-300">
            Transparency and accountability are essential to a functioning
            republic. And Capitol Hill drama is fun to follow 🍿
          </p>

          {/* Full clause quote */}
          <blockquote className="mt-4 rounded-xl border bg-neutral-50 p-4 text-[13.5px] leading-6 dark:border-neutral-800 dark:bg-neutral-900/60">
            <div className="mb-1 text-[12px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              U.S. Constitution Article I, Section 5, Clause 2
            </div>
            <p className="text-neutral-800 dark:text-neutral-200">
              “Each House may determine the Rules of its Proceedings, punish its
              Members for disorderly Behaviour, and, with the Concurrence of two
              thirds, expel a Member.”
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
