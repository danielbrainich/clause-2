'use client'

import { useEffect, useState } from 'react';

export default function Bill({ params }) {
    const { congress, billType, billNumber } = params;
    const [ oneBill, setOneBill ] = useState({})

    useEffect(() => {
        const fetchOneBill = async () => {
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
        fetchOneBill()
    }, [])


    return (
        <>
            <div>Bill</div>
        </>
    );
}
