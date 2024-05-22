'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'

export default function findBill() {
    const [billType, setBillType] = useState('');
    const [number, setNumber] = useState('');
    const [congress, setCongress] = useState('');
    const [result, setResult] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const billTypes = ["HR", "HJRES", "S", "SJRES"]

    const fetchBill = async (congress, billType, number) => {
        setIsLoading(true);
        try {
            console.log("fetching bill")
            console.log(billType)
            const response = await fetch(`api/show-bill/${congress}/${billType}/${number}`)
            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }
            const data = await response.json();
            console.log(data.bill);
            setResult(data.bill);
        }
        catch (error) {
            console.error(`failed to fetch bills: ${error}`)
        }
        setIsLoading(false);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setResult(null);
        fetchBill(congress, billType, number);
    }

    const handleChange = (e) => {
        if (e.target.id === "number") {
            setNumber(e.target.value);
        }
        else if (e.target.id === "billType") {
            setBillType(e.target.value);
            console.log(billType)
        }
        else if (e.target.id === "congress") {
            setCongress(e.target.value);
            console.log(congress)
        }
    }

    return (
        <>
            <h2 className="w-full text-4xl font-bold sm:text-center text-gray-700 mb-10">Search Bills</h2>
            <form className="w-full" onSubmit={handleSubmit}>
                <div className="sm:flex sm:items-center mb-6">
                    <div className="sm:w-1/2">
                        <label htmlFor="number"
                            className="block text-gray-700 font-bold sm:text-right mb-1 sm:mb-0 pr-4"
                        >Congress Number</label>
                    </div>
                    <div className="sm:w-2/2">
                        <input
                            id="congress"
                            type="text"
                            value={congress}
                            onChange={handleChange}
                            required
                            className="border rounded w-20 py-2 px-3 text-gray-700"
                        />
                    </div>
                </div>
                <div className="sm:flex sm:items-center mb-6">
                    <div className="sm:w-1/2">
                        <label
                            htmlFor="billType"
                            className="block text-gray-700 font-bold sm:text-right mb-1 sm:mb-0 pr-4"
                        >
                            Bill Type
                        </label>
                    </div>
                    <div className="sm:w-2/2">
                        <select
                            id="billType"
                            name="billType"
                            value={billType}
                            onChange={handleChange}
                            required
                            className="border rounded w-20 py-2 px-3 text-gray-700"
                        >
                            <option value="" disabled>---</option>
                            {billTypes.map((bill, index) => (
                                <option key={index} value={bill}>{bill}</option>
                            ))};
                        </select>
                    </div>
                </div>
                <div className="sm:flex sm:items-center mb-6">
                    <div className="sm:w-1/2">
                        <label htmlFor="number"
                            className="block text-gray-700 font-bold sm:text-right mb-1 sm:mb-0 pr-4"
                        >Bill Number</label>
                    </div>
                    <div className="sm:w-2/2">
                        <input
                            id="number"
                            type="text"
                            value={number}
                            onChange={handleChange}
                            required
                            className="border rounded w-20 py-2 px-3 text-gray-700"
                        />
                    </div>
                </div>
                <div className="sm:flex sm:items-center">
                    <div className="sm:w-1/2"></div>
                    <div className="sm:w-2/2">
                        <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded" type="submit">Search</button>
                    </div>
                </div>
            </form>
            <div>
                {result && (
                    <div className="relative sm:pl-32 py-6 group">
                        <Link href={`/bill/${result.congress}/${result.type}/${result.number}`}>
                            <div className="hover:bg-slate-100 p-4 rounded">
                                <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{`${result.type}-${result.number}`}</div>
                                <time className="left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 text-emerald-600 bg-emerald-100 rounded-full">{result.introducedDate}</time>
                                <div className="text-slate-500">{result.title}</div>
                            </div>
                        </Link>
                    </div>
                )}
                {isLoading && (
                    <div role="status" className="flex justify-center mt-10">
                        <svg aria-hidden="true" className="w-8 h-8 text-slate-400 animate-spin dark:text-slate-400 fill-indigo-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                )}
            </div>
        </>
    )
};

// add error handling in here and loading in case where a bill is not returned.
// is it possible to add a function where we search all past records for bills?
