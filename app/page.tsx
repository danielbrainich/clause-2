'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [bills, setBills] = useState([])
  const [oneBill, setOneBill] = useState({})

  const cleanActionString = (string) => {
    const twoStrings = string.split("(");
    const secondString = twoStrings[0];
    return secondString;
  }

  useEffect(() => {
    const fetchBillsList = async () => {
      try {
        const response = await fetch("/api/list-bills");
        if (!response.ok) {
          throw new Error(`http error. status: ${response.status}`)
        }
        const data = await response.json();
        setBills(data.bills)
        console.log(data.bills);
      }
      catch (error) {
        console.error(`failed to fetch list of bills: ${error}`);
      }
    }
    fetchBillsList();
  }, []);

    const fetchOneBill = async (congress, billType, billNumber) => {
      try {
        const response = await fetch(`/api/show-bill/${congress}/${billType}/${billNumber}`);
        if (!response.ok) {
          throw new Error(`http error. status: ${response.status}`);
        }
        const data = await response.json();
        setOneBill(data);
        console.log(data);
      }
      catch (error) {
        console.error(`failed to fetch one bill: ${error}`)
      }
    }


  return (

    <main className="relative min-h-screen flex flex-col justify-center bg-slate-50 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-24">
        <div className="flex flex-col justify-center divide-y divide-slate-200 [&>*]:py-16">
          <div className="w-full max-w-3xl mx-auto">

            <div className="-my-6">

              {bills.map(
                bill => (
                  <div key={bill.url} className="relative pl-8 sm:pl-32 py-6 group">
                    <div onClick={() => fetchOneBill(bill.congress, bill.type, bill.number)} className="font-caveat font-medium text-2xl text-indigo-500 mb-1 sm:mb-0 cursor-pointer">{`${bill.type}-${bill.number}`}</div>
                    <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                      <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">{bill.latestAction.actionDate}</time>
                      <div className="text-xl font-bold text-slate-900">{cleanActionString(bill.latestAction.text)}</div>
                    </div>
                    <div className="text-slate-500">{bill.title}</div>
                  </div>
                )
              )}

            </div>

          </div>
        </div>
      </div>
    </main>

  );
}
