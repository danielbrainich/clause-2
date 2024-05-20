'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'

export default function findBill() {
    const [billType, setBillType] = useState('');
    const [number, setNumber] = useState('');
    const [congress, setCongress] = useState('');
    const [results, setResults] = useState();
    const billTypes = ["HR", "HJRES", "S", "SJRES"]

    const fetchBill = async (congress, billType, number) => {
        try {
            console.log("fetching bill")
            console.log(billType)
            const response = await fetch(`api/show-bill/${congress}/${billType}/${number}`) // You'll need an input where they can put the congress number
            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }
            const data = await response.json();
            console.log(data.bill);
            setResults(data.bill);
        }
        catch (error) {
            console.error(`failed to fetch bills: ${error}`)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
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
            <h2 className="w-full text-4xl font-bold sm:text-center text-gray-700 mb-10">Search bills</h2>
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
                        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" type="submit">Submit</button>
                    </div>
                </div>
            </form>
            <div>
                {results && (
                    <div className="relative pl-8 sm:pl-32 py-6 group">
                        <Link href={`/BILL/${results.congress}/${results.type}/${results.number}`}>
                            <div className="hover:bg-slate-100 p-4 rounded">
                                <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{`${results.type}-${results.number}`}</div>
                                <time className="translate-y-0.5 text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">{results.introducedDate}</time>
                                <div className="text-slate-500">{results.title}</div>
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
};

// add error handling in here and loading in case where a bill is not returned.
// is it possible to add a function where we search all past records for bills?
