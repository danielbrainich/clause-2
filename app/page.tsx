'use client';

import { useEffect, useState } from 'react';
import { cleanActionString } from '@/app/utils/utils';
import Link from 'next/link';

export default function Home() {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);


  useEffect(() => {
    const fetchBillsList = async () => {
      try {
        const response = await fetch(`/api/list-bills/${offset}`);
        if (!response.ok) {
          throw new Error(`http error. status: ${response.status}`)
        }
        const data = await response.json();
        console.log("fetching data")
        setBills(prevBills => [...prevBills, ...data.bills]);
      }
      catch (error) {
        console.error(`failed to fetch list of bills: ${error}`);
      }
      setIsLoading(false);
    }
    fetchBillsList();
  }, [offset]);


  const links = [
    { href: "/bill", label: "Bill" }
  ]

  if (isLoading) {
    return (
      <div role="status" className="flex justify-center">
        <svg aria-hidden="true" className="w-8 h-8 text-slate-400 animate-spin dark:text-slate-400 fill-indigo-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (!bills) {
    return <div>Could not load bills data</div>
  }

  return (
    <>
      <div>
        {bills.map(
          (bill, index) => (
            <div key={index} className="relative pl-8 sm:pl-32 py-6 group">
              <Link href={`/bill/${bill.congress}/${bill.type}/${bill.number}`}>
                <div className="hover:bg-slate-100 p-4 rounded">
                  <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{`${bill.type}-${bill.number}`}</div>
                  <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                    <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">{bill.latestAction.actionDate}</time>
                    <div className="font-bold text-slate-700">{cleanActionString(bill.latestAction.text)}</div>
                  </div>
                  <div className="text-slate-500">{bill.title}</div>
                </div>
              </Link>
            </div>
          )
        )}
      </div>
      <div onClick={() => setOffset(prevOffset => prevOffset + 10)} className="cursor-pointer font-bold text-slate-700 pl-8 sm:pl-32 py-6">Show More</div>
    </>

  );
}
