'use client'

import { useState } from 'react'
import SearchBills from '@/components/searchBills'
import SearchLegislators from '@/components/searchLegislators'
import Link from 'next/link'


export default function search() {
    const [billsResults, setBillsResults] = useState()
    const [legislatorsResults, setLegislatorsResults] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    return (
        <>
            <div className="flex pb-6">
                <div className="w-1/2">
                    <SearchBills setBillsResults={setBillsResults} setLegislatorsResults={setLegislatorsResults} setIsLoading={setIsLoading} />
                </div>
                <div className="w-1/2">
                    <SearchLegislators setLegislatorsResults={setLegislatorsResults} setBillsResults={setBillsResults} setIsLoading={setIsLoading} />
                </div>
            </div>
            {console.log(billsResults, legislatorsResults)}
            {billsResults && (
                <div className="relative sm:pl-32 group">
                    <Link href={`/bill/${billsResults.congress}/${billsResults.type}/${billsResults.number}`}>
                        <div className="hover:bg-slate-100 p-4 rounded">
                            <div className="ultra font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{`${billsResults.type}-${billsResults.number}`}</div>
                            <time className="left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 text-emerald-600 bg-emerald-100 rounded-full">{billsResults.introducedDate}</time>
                            <div className="text-slate-500">{billsResults.title}</div>
                        </div>
                    </Link>
                </div>
            )}
            {legislatorsResults && legislatorsResults.map((result, index) => (
                <div className="relative sm:pl-32 group">
                    <Link key={index} href={`/pol/${result.bioguideId}`}>
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
        </>
    )
}
