'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'

export default function findRep() {
    const [allReps, setAllReps] = useState([]);
    const [searchParam, setSearchParam] = useState('');
    const [results, setResults] = useState([]);

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
        };

        fetchAllReps()
    }, []);

    const searchPols = (objects, query) => {
        const normalizedQuery = query.toLowerCase().replace(/[^a-z]/g, '');
        return objects.filter(object => object.name.toLowerCase().replace(/[^a-z]/g, '').includes(normalizedQuery))
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        const polsResponse = searchPols(allReps, searchParam);
        setResults(polsResponse);
    };

    const handleChange = (event) => {
        setSearchParam(event.target.value)
    };


    return (
        <>
            <form onSubmit={handleSubmit}>
                <label htmlFor="search">Search for reps</label>
                <input
                    id="search"
                    type="text"
                    value={searchParam}
                    onChange={handleChange}
                />
                <button type="submit">Search</button>
            </form>
            <div>
                {results && results.map((result, index) => (
                    <Link key={index} href={`/POL/${result.bioguideId}`}>
                        <div>{result.name}</div>
                    </Link>

                ))}
            </div>
        </>
    )
};
