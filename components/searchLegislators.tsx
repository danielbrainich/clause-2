'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'

export default function SearchLegislators( { setBillsResults, setLegislatorsResults, setIsLoading} ) {
    const [allReps, setAllReps] = useState([]);
    const [searchParam, setSearchParam] = useState('');

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
        if (normalizedQuery === "") {
            return [];
        }
        return objects.filter(object => object.name.toLowerCase().replace(/[^a-z]/g, '').includes(normalizedQuery))
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        setLegislatorsResults([]);
        setBillsResults();
        setIsLoading(true);
        const polsResponse = searchPols(allReps, searchParam);
        setLegislatorsResults(polsResponse);
        setIsLoading(false);
    };

    const handleChange = (event) => {
        setSearchParam(event.target.value)
    };


    return (
        <>
            <h2 className="w-full text-4xl font-bold sm:text-center text-gray-700 mb-10">Search Legislators</h2>
            <form className="w-full" onSubmit={handleSubmit}>
                <div className="sm:flex sm:items-center mb-6">
                    <div className="sm:w-1/2">
                        <label
                            htmlFor="search"
                            className="block text-gray-700 font-bold sm:text-right mb-1 sm:mb-0 pr-4"
                        >Legislator Name</label>
                    </div>
                    <div className="sm:w-2/2">
                        <input
                            id="search"
                            type="text"
                            value={searchParam}
                            onChange={handleChange}
                            required
                            className="border rounded py-2 px-3 text-gray-700"
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
