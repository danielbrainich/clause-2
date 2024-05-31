'use client'

import { useState, useEffect } from 'react';

export default function SaveLegislator({ bioguideId, name }) {
    const [records, setRecords] = useState([])
    const [legislatorSaved, setLegislatorSaved] = useState(false)

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
                for (let legislator of data) {
                    if (legislator.info == `${bioguideId}`) {
                        setLegislatorSaved(true);
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
                    bioguideId: bioguideId,
                    name: name
                })
            }
            console.log(requestOptions)
            const response = await fetch(`/api/add-record`, requestOptions);
            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }
            const data = await response.json();
            console.log(data);
            setLegislatorSaved(true);
        }
        catch (error) {
            console.error(`failed to save bill: ${error}`)
        }
    }

    return (
        <button onClick={handleClick} className="mb-5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={legislatorSaved} type="submit">Save Legislator</button>
    )
}
