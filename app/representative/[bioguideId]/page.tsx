'use client'

import { useState, useEffect } from 'react';

export default function Representative({ params }) {
    const { bioguideId } = params;
    const [rep, setRep] = useState({});
    const [sponsoredLeg, setSponsoredLeg] = useState({});
    const [cosponsoredLeg, setCosponsoredLeg] = useState({});

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

    return (
        <>
            <div className="relative pl-8 sm:pl-32 py-6 group">
                <div className="font-caveat font-medium text-xl text-indigo-500 mb-1 sm:mb-0">{rep.district ? 'Rep.' : 'Sen.'} {rep.directOrderName}</div>
                <div className="text-slate-500">{rep.partyHistory && rep.partyHistory[0].partyName} Party</div>
                <div className="text-slate-500">{rep.state}</div>

                {rep.depiction && rep.depiction.imageUrl && (
                    <img src={rep.depiction.imageUrl} alt={`Photo of ${rep.directOrderName}`} />
                )}
                <div>Sponsored Legislation</div>
                <div>Cosponsored Legislation</div>
            </div>

        </>
    )
}
