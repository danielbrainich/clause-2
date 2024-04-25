import { useEffect, useState } from 'react';

export default function Summary({ congress, billType, billNumber }) {
    const [ isLoading, setIsLoading ] = useState(true);
    const [ summary, setSummary ] = useState("");

    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/show-bill/${congress}/${billType}/${billNumber}/summaries`);
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`);
                }
                const data = await response.json();
                setSummary(data.bill);
                console.log(data.bill);
            }
            catch (error) {
                console.error(`failed to fetch one bill: ${error}`)
            }
            setIsLoading(false);
        }
        fetchSummary()
    }, [])


    return (
        <>
            <div className="text-slate-500">Summary</div>
            <div className="text-slate-500">{congress}</div>
            <div className="text-slate-500">{billType}</div>
            <div className="text-slate-500">{billNumber}</div>
        </>
    );
}
