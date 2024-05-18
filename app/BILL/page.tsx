'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'

export default function findBill() {
    const [billType, setBillType] = useState('');
    const [number, setNumber] = useState('');
    const [results, setResults] = useState({});
    const billTypes = ["HR", "HJRES", "S", "SJRES"]

    const fetchBill = async (billType, number) => {
        try {
            console.log("fetching bill")
            console.log(billType)
            const response = await fetch(`api/show-bill/118/${billType}/${number}`) // You'll need an input where they can put the congress number
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
        fetchBill(billType, number);
    }

    const handleChange = (e) => {
        if (e.target.id === "number") {
            setNumber(e.target.value);
        }
        else if (e.target.id === "billType") {
            setBillType(e.target.value);
            console.log(billType)
        }
    }

    return (
        <>
            <div>Find bills</div>
            <form onSubmit={handleSubmit}>
                <label htmlFor="billType">Type</label>
                <select
                    id="billType"
                    name="billType"
                    value={billType}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>---</option>
                    {billTypes.map((bill, index) => (
                        <option key={index} value={bill}>{bill}</option>
                    ))};
                </select>
                <label htmlFor="number">Number</label>
                <input
                    id="number"
                    type="text"
                    value={number}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Submit</button>
            </form>
            <div>
                    <Link href={`/BILL/${results.congress}/${results.type}/${results.number}`}>
                        <div>{results.title}</div>
                    </Link>
            </div>
        </>
    )
};

// add error handling in here and loading in case where a bill is not returned.
// is it possible to add a function where we search all past records for bills?
