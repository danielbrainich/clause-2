'use client'

import { useEffect, useState } from 'react';
import { cleanActionString } from '@/app/utils/utils';

export default function Bill({ params }) {
    const { congress, billType, billNumber } = params;
    const [oneBill, setOneBill] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOneBill = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/show-bill/${congress}/${billType}/${billNumber}`);
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`);
                }
                const data = await response.json();
                setOneBill(data.bill);
                console.log(data.bill);
            }
            catch (error) {
                console.error(`failed to fetch one bill: ${error}`)
            }
            setIsLoading(false);
        }
        fetchOneBill()
    }, [])

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!oneBill) {
        return <div>Could not load bill data</div>
    }

    return (
        <>
            <div className="relative pl-8 sm:pl-32 py-6 group">
                <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{`${oneBill.type}-${oneBill.number}`}</div>
                <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                    <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">{oneBill.latestAction.actionDate}</time>
                    <div className="font-bold text-slate-900">{cleanActionString(oneBill.latestAction.text)}</div>
                </div>
                <div className="text-slate-500">{oneBill.title}</div>
                {oneBill.sponsors.map((sponsor, index) => (
                    <div key={index} className="text-slate-500">Rep. {sponsor.firstName} {sponsor.lastName} ({sponsor.party}-{sponsor.state})</div>
                    ))}
                <div className="text-slate-500">{oneBill.policyArea.name}</div>
            </div>
        </>
    );
}
