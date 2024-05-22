'use client'

import { useEffect, useState } from 'react';

export default function savedRecords() {
    const [records, setRecords ] = useState([])

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await fetch(`/api/view-records`);
                if (!response.ok) {
                    throw new Error(`http error: ${response.status}`)
                }
                const data = await response.json();
                console.log(data);
                setRecords(data);
            }
            catch (error) {
                console.error(`failed to fetch records: ${error}`)
            }
        }
        fetchRecords()
    }, [])


    return (
        <>
        <div>hello</div>
        </>
    )
}
