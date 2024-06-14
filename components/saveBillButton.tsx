'use client'

import { useState, useEffect } from 'react';

export default function SaveBillButton({ billType, billNumber, congress, billTitle }) {
    const [records, setRecords] = useState([]);
    const [billSaved, setBillSaved] = useState(false);
    const [responseStatus, setResponseStatus] = useState("200");

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await fetch(`/api/view-records`);
                if (!response.ok) {
                    throw new Error(`http error: ${response.status}`)
                }
                const data = await response.json();
                console.log("my important data", data)
                setRecords(data);
                for (let bill of data) {
                    if (bill.info == `${congress}-${billType}-${billNumber}`) {
                        setBillSaved(true);
                    }
                }

            }
            catch (error) {
                console.error(`failed to fetch records: ${error}`)
            }
        }
        fetchRecords()
    }, [])

    const handleClick = async () => {
        try {
            const requestOptions = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    congress: congress,
                    billType: billType,
                    billNumber: billNumber,
                    billTitle: billTitle
                })
            }
            const response = await fetch(`/api/add-record`, requestOptions);
            setResponseStatus(response.status)
            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }
            const data = await response.json();
            console.log(data);
            setBillSaved(true)
            console.log("Is bill saved?", billSaved)
        }
        catch (error) {
            console.error(`failed to save bill: ${error}`)
        }
    }

    return (
        <>
        <button onClick={handleClick} className="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={billSaved} type="submit">Save Bill</button>
        {console.log("responseStatus", responseStatus)}
        {responseStatus.toString().includes("4") || responseStatus.toString().includes("5") && (
            <div className="text-emerald-600 bg-emerald-100 p-4 rounded mt-4">Unable to save bill to your saved items. Please make sure you&apos;re signed up and logged in!</div>
        )}
        </>
    )
}
