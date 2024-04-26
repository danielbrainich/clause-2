import { useEffect, useState } from 'react';

export default function Cosponsors({ congress, billType, billNumber }) {
    const [ isLoading, setIsLoading ] = useState(true);
    const [ cosponsors, setCosponsors ] = useState("");

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
            <div className="text-slate-500">Cosponsors</div>
            {cosponsors && cosponsors.map(cosponsor => {
                return (
                <div key={cosponsor.url} className="text-slate-500">{cosponsor.fullName}</div>
            )})}
        </>
    );
}
