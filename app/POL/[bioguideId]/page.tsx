'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'
import { cleanActionString } from '@/app/utils/utils';

export default function Representative({ params }) {
    const { bioguideId } = params;
    const [rep, setRep] = useState({});
    const [sponsoredLeg, setSponsoredLeg] = useState([]);
    const [cosponsoredLeg, setCosponsoredLeg] = useState([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const fetchRep = async () => {
            try {
                const response = await fetch(`/api/show-rep/${bioguideId}`)
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`);
                }
                const data = await response.json()
                setRep(data.member);
                console.log(data.member)
            }
            catch (error) {
                console.error(`error fetching data: ${error}`);
            }
            setIsLoading(false);
        }

        fetchRep()
    }, [])

    useEffect(() => {
        const fetchSponsoredLeg = async () => {
            try {
                const response = await fetch(`/api/rep/sponsored-legislation/${bioguideId}`)
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`)
                }
                const data = await response.json();
                setSponsoredLeg(data.sponsoredLegislation);
                console.log(data.sponsoredLegislation)
            }
            catch (error) {
                console.error(`error fetching data: ${error}`);
            }
        }
        fetchSponsoredLeg()
    }, [])

    useEffect(() => {
        const fetchCosponsoredLeg = async () => {
            try {
                const response = await fetch(`/api/rep/cosponsored-legislation/${bioguideId}`)
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`)
                }
                const data = await response.json();
                setCosponsoredLeg(data.cosponsoredLegislation);
                console.log(data.cosponsoredLegislation)
            }
            catch (error) {
                console.error(`error fetching data: ${error}`);
            }
        }
        fetchCosponsoredLeg()
    }, [])

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!rep) {
        return <div>Could not load bills data</div>
    }

    return (
        <>
            <div className="relative pl-8 sm:pl-32 py-6 group">
                <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{rep.district ? 'Rep.' : 'Sen.'} {rep.directOrderName}</div>
                <div className="text-slate-500">{rep.partyHistory && rep.partyHistory[0].partyName} Party</div>
                <div className="text-slate-500">{rep.state}</div>

                {rep.depiction && rep.depiction.imageUrl && (
                    <img src={rep.depiction.imageUrl} alt={`Photo of ${rep.directOrderName}`} />
                )}
            </div>
            <div>Sponsored Legislation</div>
            {console.log("sponsoredLeg", sponsoredLeg)}
            {sponsoredLeg && sponsoredLeg.filter(bill => bill.title !== undefined).map((bill, index) => (
                <div key={index} className="relative pl-8 sm:pl-32 py-6 group">
                    <Link href={`/BILL/${bill.congress}/${bill.type}/${bill.number}`}>
                        <div className="hover:bg-slate-100 p-4 rounded">
                            <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{`${bill.type}-${bill.number}`}</div>
                            <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                                <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">{bill.introducedDate}</time>
                            </div>
                            <div className="text-slate-500">{bill.title}</div>
                        </div>
                    </Link>
                </div>
            ))}
        </>

    )


}
