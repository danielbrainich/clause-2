'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cosponsors from '@/components/cosponsors'
import Actions from '@/components/actions'
import Text from '@/components/text'

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
                <div className="text-slate-500">{oneBill.title}</div>
                <div className="font-bold text-slate-900">{oneBill.sponsors.length > 1 ? "Sponsors" : "Sponsor"}</div>
                {oneBill.sponsors.map((sponsor, index) => (
                    <Link key={index} href={`/representative/${sponsor.bioguideId}`}>
                        {console.log(sponsor)}
                        <div className="text-slate-500">{sponsor.district ? 'Rep.' : 'Sen.'}{sponsor.fullname} {sponsor.lastName} [{sponsor.party}-{sponsor.state}{sponsor.district ? `-${sponsor.district}` : ''}]</div>
                    </Link>
                ))}
                {oneBill?.policyArea?.name && (
                    <>
                        <div className="font-bold text-slate-900">Policy Area</div>
                        <div className="text-slate-500">{oneBill.policyArea.name}</div>
                    </>
                )}
                <Cosponsors congress={congress} billType={billType} billNumber={billNumber} />
                <Actions congress={congress} billType={billType} billNumber={billNumber} />
                <Text congress={congress} billType={billType} billNumber={billNumber} />
            </div>
        </>
    );
}
