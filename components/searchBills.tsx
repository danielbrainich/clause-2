'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'

export default function SearchBills( { setBillsResults, setLegislatorsResults, setIsLoading} ) {
    const [billType, setBillType] = useState('');
    const [number, setNumber] = useState('');
    const [congress, setCongress] = useState('');
    const billTypes = ["HR", "HJRES", "S", "SJRES"]

    const fetchBill = async (congress, billType, number) => {
        setLegislatorsResults([])
        setBillsResults()
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
            setBillsResults(data.bill)
        }
        catch (error) {
            console.error(`failed to fetch bills: ${error}`)
        }
        setIsLoading(false);
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
        </>
    )
};

// add error handling in here and loading in case where a bill is not returned.
// is it possible to add a function where we search all past records for bills?
