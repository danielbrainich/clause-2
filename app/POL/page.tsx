'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'

export default function findRep() {
    const [allReps, setAllReps] = useState([]);
    const [searchParam, setSearchParam] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false)

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
        setResults(null);
        setIsLoading(true);
        const polsResponse = searchPols(allReps, searchParam);
        setResults(polsResponse);
        setIsLoading(false);
    };

    const handleChange = (event) => {
        setSearchParam(event.target.value)
    };


    return (
        <>
            <h2 className="w-full text-4xl font-bold sm:text-center text-gray-700 mb-10">Search legislators</h2>
            <form className="w-full" onSubmit={handleSubmit}>
                <div className="sm:flex sm:items-center mb-6">
                    <div className="sm:w-1/2">
                        <label
                            htmlFor="search"
                            className="block text-gray-700 font-bold sm:text-right mb-1 sm:mb-0 pr-4"
                        >Search legislators</label>
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
            <div>
                {results && results.map((result, index) => (
                    <div className="relative sm:pl-32 group">

                        <Link key={index} href={`/POL/${result.bioguideId}`}>
                            <div className="text-slate-500 hover:text-indigo-500 underline-animation w-fit">{result.name}</div>
                        </Link>
                    </div>
                ))}
                {isLoading && (
                    <div role="status" className="flex justify-center mt-10">
                        <svg aria-hidden="true" className="w-8 h-8 text-slate-400 animate-spin dark:text-slate-400 fill-indigo-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                )}
            </div>
        </>
    )
};
