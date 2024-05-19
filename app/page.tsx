'use client';

import { useEffect, useState } from 'react';
import { cleanActionString } from '@/app/utils/utils';
import Link from 'next/link';

export default function Home() {
  const [bills, setBills] = useState([]);
  const [oneBill, setOneBill] = useState({});
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
    return <div>Loading...</div>
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
              <Link href={`/BILL/${bill.congress}/${bill.type}/${bill.number}`}>
                <div className="hover:bg-slate-100 p-4 rounded">
                  <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{`${bill.type}-${bill.number}`}</div>
                  <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                    <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">{bill.latestAction.actionDate}</time>
                    <div className="font-bold text-slate-900">{cleanActionString(bill.latestAction.text)}</div>
                  </div>
                  <div className="text-slate-500">{bill.title}</div>
                </div>
              </Link>
            </div>
          )
        )}
      </div>
      <div onClick={() => setOffset(prevOffset => prevOffset + 10)} className="cursor-pointer font-bold text-slate-900">Show More</div>
    </>

  );
}
