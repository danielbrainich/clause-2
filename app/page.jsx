"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cleanActionString } from "@/app/utils/utils";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "400" });
const inter = Inter({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: '400' });

export default function Home() {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  useEffect(() => {
    const fetchBillsList = async () => {
      try {
        const response = await fetch(`/api/list-bills/${offset}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        setBills((prev) => [...prev, ...data.bills]);
      } catch (error) {
        console.error("Failed to fetch bills:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBillsList();
  }, [offset]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-20 text-blue-600">
        <svg
          className="w-8 h-8 animate-spin"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            className="opacity-30"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116..."
            fill="currentColor"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!bills) {
    return (
      <div className="text-center mt-20 text-red-600">
        Could not load bills data.
      </div>
    );
  }

  return (
    <>
      <div>
      {bills.map((bill, index) => (
  <div key={index} className="relative pl-8 sm:pl-32 py-6 group">
    <Link href={`/bill/${bill.congress}/${bill.type}/${bill.number}`}>
      <div className="hover:bg-blue-50 hover:border-l-4 hover:border-blue-600 transition-all border-slate-300 p-4">
        <div
          className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden
                     before:absolute before:left-2 sm:before:left-0 before:w-px before:h-full before:px-px before:bg-slate-300
                     sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3
                     after:absolute after:left-2 sm:after:left-0 after:w-4 after:h-0.5 after:bg-slate-300 after:content-['']
                     sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-3"
        >
<time className={`${mono.className} sm:absolute left-0 translate-y-[3px] -translate-x-[16px] ml-[0.15rem] mb-2 sm:mb-0 text-sm font-medium text-red-700`}>
            {formatDate(bill.latestAction.actionDate)}
          </time>
          <div className={`${mono.className} text-sm text-blue-700 mb-1 translate-y-[3px]`}>
            {bill.type}-{bill.number}
          </div>
        </div>
        <div className={`${inter.className} text-sm font-medium text-slate-800 tracking-tight mb-1`}>
          {cleanActionString(bill.latestAction.text)}
        </div>
        <div className={`${inter.className} text-sm text-slate-600 leading-snug`}>
          {bill.title}
        </div>
      </div>
    </Link>
  </div>
))}
      </div>

      {/* Show More button */}
      <div
        onClick={() => setOffset((prev) => prev + 10)}
        className="w-fit cursor-pointer font-semibold text-blue-700 pl-8 sm:pl-32 py-6 underline-animation hover:text-blue-900"
      >
        Show More
      </div>
    </>
  );
}
