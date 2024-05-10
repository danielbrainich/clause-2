'use client'

import { useState, useEffect } from 'react';

export default function findRep() {
    const [allReps, setAllReps] = useState({})

    useEffect(() => {
        const fetchAllReps = async () => {
            try {
                const response = await fetch('/api/rep');
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`);
                }
                const data = await response.json();
                console.log(data)
                setAllReps(data)
            }
            catch (error) {
                console.error(`failed to fetch all reps: ${error}`)
            }
        }

        fetchAllReps()
    }, [])

    return (
        <div>Hello world</div>
    )
};
