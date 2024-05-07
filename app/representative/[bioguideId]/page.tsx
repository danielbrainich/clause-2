'use client'

import { CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH } from 'next/dist/shared/lib/constants';
import { useState, useEffect } from 'react';

export default function Representative({ params }) {
    const { bioguideId } = params;
    const [rep, setRep] = useState({});

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

    return (
        <>
            <div>{rep.directOrderName}</div>
            {rep.depiction && rep.depiction.imageUrl && (
                <img src={rep.depiction.imageUrl} alt={`Photo of ${rep.directOrderName}`} />
                )}
        </>
    )
}
