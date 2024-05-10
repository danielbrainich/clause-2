import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Cosponsors({ congress, billType, billNumber }) {
    const [isLoading, setIsLoading] = useState(true);
    const [cosponsors, setCosponsors] = useState("");

    useEffect(() => {
        const fetchCosponsors = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/show-bill/${congress}/${billType}/${billNumber}/cosponsors`);
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`);
                }
                const data = await response.json();
                setCosponsors(data.cosponsors);
                console.log(data.cosponsors);
            }
            catch (error) {
                console.error(`failed to fetch one bill: ${error}`)
            }
            setIsLoading(false);
        }
        fetchCosponsors()
    }, [])


    return (
        <>
            <div className="font-bold text-slate-900">{cosponsors.length === 1 ? "Cosponsor" : "Cosponsors"}</div>
            {cosponsors && cosponsors.length > 0 ? (
                cosponsors.map(cosponsor => (
                    <Link key={cosponsor.url} href={`/POL/${cosponsor.bioguideId}`}>
                    <div className="text-slate-500">{cosponsor.fullName}</div>
                    </Link>
                ))
                ) : (
                    <div className="text-slate-500">None</div>
                )}
        </>
    );
}
